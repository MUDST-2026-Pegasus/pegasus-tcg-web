import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { useTranslate } from "@/lib/i18n";

export function ProductThumbnail({ imageUrl, name, className }: {
  imageUrl: string | null;
  name: string;
  className: string;
}) {
  const { t } = useTranslate("seller");
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl && imageUrl !== failedUrl);

  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary ${className}`}>
      <ImageIcon aria-hidden="true" className="size-3.5 text-gray-400" />
      {showImage && (
        <img
          src={imageUrl!}
          alt={t("dashboard.productImageAlt", "รูปสินค้า {name}", { name })}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailedUrl(imageUrl)}
        />
      )}
    </div>
  );
}
