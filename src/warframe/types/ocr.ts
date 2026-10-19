export interface OcrAPISecret {
  id: string
  key: string
}

/** Vendor-neutral OCR evidence; coordinates are in image pixels. */
export interface OcrTextBlock {
  text: string
  confidence?: number
  box?: { x: number, y: number, width: number, height: number }
}
