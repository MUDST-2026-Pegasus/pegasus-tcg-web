export type StatAccent = "primary" | "teal" | "green";

export type StatCardData = {
  id: string;
  label: string;
  value: string;
  delta: string;
  footnote: string;
  bars: number[];
  accent: StatAccent;
};

export type ActivityStatus = "pending" | "attention" | "success";

export type ActivityItem = {
  id: string;
  initials: string;
  avatarAccent: "teal" | "red" | "primary" | "green";
  name: string;
  time: string;
  message: string;
  status: ActivityStatus;
  statusLabel: string;
};

export type TopSeller = {
  id: string;
  name: string;
  amount: string;
  percent: number;
};

export type MonthlySalesPoint = {
  month: string;
  singles: number;
  sealed: number;
};

export type GameShareSlice = {
  id: string;
  name: string;
  value: number;
};

export type AdminOverviewData = {
  title: string;
  subtitle: string;
  stats: StatCardData[];
  monthlySales: {
    title: string;
    description: string;
    points: MonthlySalesPoint[];
  };
  activity: {
    title: string;
    description: string;
    items: ActivityItem[];
    actionLabel: string;
  };
  topSellers: {
    title: string;
    description: string;
    items: TopSeller[];
  };
  gameShare: {
    title: string;
    description: string;
    slices: GameShareSlice[];
    footnoteTitle: string;
    footnoteDescription: string;
  };
};
