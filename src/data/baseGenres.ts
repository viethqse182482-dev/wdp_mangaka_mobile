/**
 * Danh sách thể loại chuẩn trên mobile, khớp giá trị `genre` / `category` trên BE (Series).
 * Lưu ý: Casing & dấu phải khớp whitelist Series.GENRES trong models/Series.js của BE,
 * vì BE filter chính xác theo chuỗi này (đã bỏ các mục BE không có: "Gia đình", "Siêu anh hùng").
 */
export const BASE_GENRES = [
  'Phiêu Lưu',
  'Hành Động',
  'Siêu Nhiên',
  'Kinh Dị',
  'Fantasy',
  'Hài Hước',
  'Thể Thao',
  'Shounen',
  'Lịch Sử',
] as const;

export type BaseGenre = (typeof BASE_GENRES)[number];
