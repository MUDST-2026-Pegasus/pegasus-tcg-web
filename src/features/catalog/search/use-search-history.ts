import { useEffect, useState } from "react";

import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  readViewedProducts,
  removeRecentSearch,
  subscribeSearchHistory,
} from "./search-history";

/** คำค้นล่าสุด + สินค้าที่ดูล่าสุด — render ใหม่เมื่อมีที่ไหนเพิ่ม/ลบ [TCG-776] */
export function useSearchHistory() {
  const [recent, setRecent] = useState(readRecentSearches);
  const [viewed, setViewed] = useState(readViewedProducts);

  useEffect(
    () =>
      subscribeSearchHistory(() => {
        setRecent(readRecentSearches());
        setViewed(readViewedProducts());
      }),
    [],
  );

  return {
    recent,
    viewed,
    add: addRecentSearch,
    remove: removeRecentSearch,
    clear: clearRecentSearches,
  };
}
