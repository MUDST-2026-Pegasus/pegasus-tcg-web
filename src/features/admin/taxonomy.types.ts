/**
 * body ที่ส่งไป `AdminCatalogTaxonomyController.java` — ลอกจาก `dto/GameRequest.java`,
 * `GameAttributeRequest.java`, `CardSetRequest.java`, `CategoryRequest.java` ใน `pegasus-tcg-api`
 * ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 *
 * ตัวข้อมูลที่ backend ส่งกลับ (`Game`, `GameAttribute`, `CardSet`, `CatalogCategory`)
 * อยู่ใน `catalog.types.ts` อยู่แล้ว เพราะหน้าแคตตาล็อกอ่านก้อนเดียวกัน
 *
 * ทุก PUT เขียนทับทั้งแถว — ช่องที่ไม่ส่งจะถูกล้างหรือกลับเป็นค่าเริ่มต้น
 * แก้ช่องเดียว (เช่นสวิตช์) จึงต้องส่งค่าเดิมของช่องอื่นไปครบ
 */

import type { AttributeDataType } from "./catalog.types";

/** `GameRequest` — `slug` อ่านเฉพาะตอนสร้าง หลังจากนั้นลิงก์ชี้มาแล้วจึงแก้ไม่ได้ */
export type GamePayload = {
  /** เก็บเป็นตัวพิมพ์ใหญ่ เช่น POKEMON — A-Z 0-9 _ */
  code: string;
  name: string;
  nameLocal: string | null;
  /** `null` = ให้ backend สร้างจากชื่อ */
  slug: string | null;
  logoUrl: string | null;
  displayOrder: number;
  active: boolean;
};

/** `GameAttributeRequest` */
export type AttributePayload = {
  /** a-z 0-9 _ ขึ้นต้นด้วยตัวอักษร — ค่าของการ์ดเก็บใต้คีย์นี้ */
  attrKey: string;
  label: string;
  dataType: AttributeDataType;
  /** ENUM ต้องมีอย่างน้อยหนึ่งตัว ชนิดอื่นต้องเป็น `[]` ไม่งั้นได้ `INVALID_ATTRIBUTE_DEFINITION` */
  options: string[];
  filterable: boolean;
  required: boolean;
  displayOrder: number;
};

/** `CardSetRequest` — เกมมาจาก path ตอนสร้าง และย้ายเกมไม่ได้ */
export type CardSetPayload = {
  /** A-Z a-z 0-9 . - _ เก็บเป็นตัวพิมพ์ใหญ่ ห้ามซ้ำในเกมเดียวกัน */
  code: string;
  name: string;
  nameLocal: string | null;
  /** `yyyy-MM-dd` — ใส่วันในอนาคตได้ (ลงแคตตาล็อกก่อนวางขาย) */
  releaseDate: string | null;
  totalCards: number | null;
  logoUrl: string | null;
};

/** `CategoryRequest` — `gameId` กับ `slug` อ่านเฉพาะตอนสร้าง */
export type CategoryPayload = {
  /** `null` = ใช้กับทุกเกม */
  gameId: number | null;
  /** ซ้อนได้ชั้นเดียว: หมวดแม่ต้องอยู่ระดับบนสุด และเป็นหมวดข้ามเกมหรือเกมเดียวกัน */
  parentId: number | null;
  /** A-Z 0-9 _ */
  code: string;
  name: string;
  slug: string | null;
  displayOrder: number;
  active: boolean;
  /** object key จาก `useFileUpload({ purpose: "CATALOG_IMAGE" })` หรือ key เดิม */
  imageKey: string | null;
};

/** `dto/CategoryResponse.java` ของ `GET /categories` — ตัว public ที่เซ็น URL รูปให้แล้ว */
export type PublicCategory = {
  id: number;
  gameId: number | null;
  parentId: number | null;
  code: string;
  name: string;
  slug: string;
  displayOrder: number;
  /** presigned GET อายุสั้น — `null` เมื่อหมวดไม่มีรูป */
  imageUrl: string | null;
};
