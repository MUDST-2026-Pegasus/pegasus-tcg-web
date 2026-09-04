export type ShopField = {
  id: string;
  label: string;
  value: string;
  helper: string;
};

export type ShopPolicy = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type ShopPreviewStat = {
  id: string;
  value: string;
  label: string;
};

export type ShopPreviewTag = {
  id: string;
  label: string;
};

export type ShopVerificationItem = {
  id: string;
  label: string;
  verified: boolean;
};

export type ShopData = {
  title: string;
  subtitle: string;
  actions: {
    cancelLabel: string;
    saveLabel: string;
  };
  completeness: {
    percent: number;
    title: string;
    remainingLabel: string;
    description: string;
  };
  info: {
    title: string;
    description: string;
    fields: ShopField[];
  };
  policies: {
    title: string;
    description: string;
    items: ShopPolicy[];
  };
  preview: {
    label: string;
    shopName: string;
    description: string;
    initials: string;
    stats: ShopPreviewStat[];
    tags: ShopPreviewTag[];
  };
  verification: {
    title: string;
    statusLabel: string;
    items: ShopVerificationItem[];
  };
};
