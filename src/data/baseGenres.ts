/**
 * Danh sách thể loại chuẩn trên mobile, khớp giá trị `genre` / `category` trên BE (Series).
 */
export const BASE_GENRES = [
  'Phiêu lưu',
  'Hành động',
  'Siêu nhiên',
  'Kinh dị',
  'Fantasy',
  'Hài hước',
  'Gia đình',
  'Thể thao',
  'Shounen',
  'Lịch sử',
  'Siêu anh hùng',
] as const;

export type BaseGenre = (typeof BASE_GENRES)[number];
