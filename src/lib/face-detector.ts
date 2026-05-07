// MediaPipe FaceLandmarker — runs alongside MoveNet to provide facial
// expression (blendshapes) + Eye Aspect Ratio (drowsiness) signals.
//
// Privacy: pure on-device inference. Model is downloaded once from Google's
// CDN and cached; no per-frame data leaves the browser.
//
// This module is INTENTIONALLY isolated from `ai-detector.ts` so the
// MoveNet pipeline keeps working unchanged if MediaPipe fails to load.

import {
  FilesetResolver,
  FaceLandmarker,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision'
import { logger } from './logger'

export interface FaceSignals {
  // Highest-weight blendshape categories — semantic shortcuts derived from
  // the 52 raw blendshape coefficients.
  emotion: 'happy' | 'sad' | 'surprised' | 'frowning' | 'neutral'
  emotionIntensity: number // 0..1

  // Eye Aspect Ratio: low value (< ~0.18) for ≥2s = eyes closed = drowsy.
  earAvg: number

  // Convenience flags computed in this module so callers don't repeat math.
  eyesClosed: boolean
  smiling: boolean
}

const MEDIAPIPE_TASK_BASE_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

class FaceDetector {
  private landmarker: FaceLandmarker | null = null
  private isInitialized = false
  private isInitializing = false
  private initPromise: Promise<boolean> | null = null

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true
    if (this.initPromise) return this.initPromise

    this.isInitializing = true
    this.initPromise = (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(
          MEDIAPIPE_TASK_BASE_URL
        )
        this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL,
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          numFaces: 1,
          runningMode: 'VIDEO',
        })
        this.isInitialized = true
        logger.info('[FaceDetector] MediaPipe FaceLandmarker ready')
        return true
      } catch (err) {
        logger.error('[FaceDetector] Failed to initialize:', err)
        return false
      } finally {
        this.isInitializing = false
      }
    })()

    return this.initPromise
  }

  /**
   * Run a single inference. Returns null if the model is not ready or the
   * video has no frame yet — callers should treat null as "no new info" and
   * keep their last signal.
   */
  detect(video: HTMLVideoElement, timestampMs: number): FaceSignals | null {
    if (!this.landmarker || !video || video.readyState < 2) return null

    let result: FaceLandmarkerResult
    try {
      result = this.landmarker.detectForVideo(video, timestampMs)
    } catch (err) {
      logger.warn('[FaceDetector] detect threw:', err)
      return null
    }

    if (
      !result.faceLandmarks ||
      result.faceLandmarks.length === 0 ||
      !result.faceBlendshapes ||
      result.faceBlendshapes.length === 0
    ) {
      return null
    }

    const landmarks = result.faceLandmarks[0]
    const blendshapes = result.faceBlendshapes[0].categories

    // Extract a few high-signal blendshape scores by category name. Names
    // come from MediaPipe's standard blendshape vocabulary (52 categories).
    const score = (name: string): number =>
      blendshapes.find((c) => c.categoryName === name)?.score ?? 0

    const smile = (score('mouthSmileLeft') + score('mouthSmileRight')) / 2
    const frown = (score('mouthFrownLeft') + score('mouthFrownRight')) / 2
    const browInner = score('browInnerUp')
    const eyeBlinkLeft = score('eyeBlinkLeft')
    const eyeBlinkRight = score('eyeBlinkRight')
    const jawOpen = score('jawOpen')

    // Pick a single dominant emotion. Values are heuristic but match common
    // FACS-blendshape interpretations.
    let emotion: FaceSignals['emotion'] = 'neutral'
    let emotionIntensity = 0
    const emotions: Array<[FaceSignals['emotion'], number]> = [
      ['happy', smile],
      ['sad', frown],
      ['surprised', Math.max(0, jawOpen - 0.2) + Math.max(0, browInner - 0.2)],
      ['frowning', Math.max(0, browInner - smile)],
    ]
    for (const [name, intensity] of emotions) {
      if (intensity > emotionIntensity && intensity > 0.25) {
        emotion = name
        emotionIntensity = intensity
      }
    }

    // EAR via MediaPipe landmark indices for eye corners + lids.
    // Using the 6-point method (Soukupová & Čech, 2016) adapted for the
    // MediaPipe 478-point face mesh.
    const ear = (eye: number[]): number => {
      // eye = [outerCorner, upperA, upperB, innerCorner, lowerB, lowerA]
      const p = (i: number) => landmarks[i]
      const dist = (a: number, b: number) => {
        const pa = p(a)
        const pb = p(b)
        return Math.hypot(pa.x - pb.x, pa.y - pb.y)
      }
      const v1 = dist(eye[1], eye[5])
      const v2 = dist(eye[2], eye[4])
      const h = dist(eye[0], eye[3])
      return h > 0 ? (v1 + v2) / (2 * h) : 0.3
    }

    // MediaPipe FaceMesh indices for the standard 6-point eye landmarks.
    const leftEyeIdx = [33, 160, 158, 133, 153, 144]
    const rightEyeIdx = [263, 387, 385, 362, 380, 373]
    const earLeft = ear(leftEyeIdx)
    const earRight = ear(rightEyeIdx)
    const earAvg = (earLeft + earRight) / 2

    // Cross-check EAR with the blendshape blink score — robust if either
    // signal is weak.
    const blinkAvg = (eyeBlinkLeft + eyeBlinkRight) / 2
    const eyesClosed = earAvg < 0.18 || blinkAvg > 0.55

    return {
      emotion,
      emotionIntensity,
      earAvg,
      eyesClosed,
      smiling: smile > 0.35,
    }
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

export const faceDetector = new FaceDetector()

/** Vietnamese label + emoji for an emotion — used by UI components. */
export function emotionLabel(
  e: FaceSignals['emotion']
): { label: string; emoji: string } {
  switch (e) {
    case 'happy':
      return { label: 'Vui', emoji: '😊' }
    case 'sad':
      return { label: 'Buồn', emoji: '😞' }
    case 'surprised':
      return { label: 'Ngạc nhiên', emoji: '😮' }
    case 'frowning':
      return { label: 'Bối rối', emoji: '😕' }
    default:
      return { label: '', emoji: '' }
  }
}
