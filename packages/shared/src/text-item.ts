/** A rectangle on a page, in PDF points with the origin at the top left corner. */
export interface Box {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextItem extends Box {
  text: string;
}

export function unionBox(boxes: Box[]): Box | null {
  if (boxes.length === 0) return null;
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  return { page: boxes[0].page, x: left, y: top, width: right - left, height: bottom - top };
}
