/**
 * 정답 영역 판정 유틸
 * RECT: (x, y, width, height) 비율 0~1
 * POLYGON: [{x, y}, ...] 꼭짓점 배열, Ray casting 알고리즘
 */

export interface RectPoints {
  x: number
  y: number
  width: number
  height: number
}

export interface PolygonPoints {
  x: number
  y: number
}[]

export type PointsJson = RectPoints | PolygonPoints

export function isPointInRect(
  x: number,
  y: number,
  rect: RectPoints
): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

/**
 * Ray casting: 점에서 오른쪽으로 무한대까지 ray를 쏘았을 때
 * 다각형 경계와 교차하는 횟수가 홀수면 내부, 짝수면 외부
 */
export function isPointInPolygon(
  x: number,
  y: number,
  polygon: PolygonPoints
): boolean {
  if (polygon.length < 3) return false

  let inside = false
  const n = polygon.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}

export function judgeClick(
  normalizedX: number,
  normalizedY: number,
  shapeType: string,
  pointsJson: PointsJson,
  tolerance = 0
): boolean {
  const x = Number(normalizedX)
  const y = Number(normalizedY)

  if (shapeType === 'RECT') {
    const rect = pointsJson as RectPoints
    if (rect.x === undefined || rect.width === undefined) return false
    return isPointInRect(x, y, rect)
  }

  if (shapeType === 'POLYGON') {
    const polygon = pointsJson as PolygonPoints
    if (!Array.isArray(polygon) || polygon.length < 3) return false
    return isPointInPolygon(x, y, polygon)
  }

  if (shapeType === 'CIRCLE') {
    const circle = pointsJson as { cx: number; cy: number; r: number }
    if (circle.cx === undefined || circle.r === undefined) return false
    const dx = x - circle.cx
    const dy = y - circle.cy
    const distSq = dx * dx + dy * dy
    const r = (circle.r + (tolerance || 0)) * (circle.r + (tolerance || 0))
    return distSq <= r
  }

  return false
}
