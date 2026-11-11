describe('Admin weekly stock and profit report', () => {
  const adminUser = {
    id: 99,
    email: 'admin@pegasus.com',
    username: 'superadmin',
    displayName: 'Super Admin',
    roles: ['ADMIN'],
    status: 'ACTIVE',
    bio: null,
    phone: null,
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: null,
  };
  const buyerUser = { ...adminUser, id: 5, username: 'buyeruser', roles: ['BUYER'] };

  const ROUTE = '/admin/reports/weekly-stock-profit';
  const API = '**/api/v1/admin/reports/weekly-stock-profit';

  const row = (
    game: string,
    gameSlug: string,
    productType: string,
    productTypeLabel: string,
    [initialStock, soldCount, remainingStock]: number[],
    gmv: number,
    status: string,
    statusLabel: string,
  ) => ({
    game, gameSlug, productType, productTypeLabel, initialStock, soldCount, remainingStock,
    gmv, commission: gmv * 0.03, netProfit: gmv * 0.03, status, statusLabel,
  });

  const report = {
    startDate: '2026-08-03',
    endDate: '2026-08-09',
    hasData: true,
    meta: {
      startDate: '2026-08-03', endDate: '2026-08-09', timezone: 'Asia/Bangkok',
      gameCategory: null, productType: null, commissionRatePercent: 3.0,
    },
    summary: {
      gmv: 428500, weeklyGmv: 428500, commission: 12855, commissionCollected: 12855, netProfit: 12855,
      initialStock: 7654, soldCount: 1470, remainingStock: 6184, stockDepleted: 1470, wowChangePercent: 18.2,
    },
    chartData: [
      ['2026-08-03', 17000, 20000],
      ['2026-08-04', 20000, 25000],
      ['2026-08-05', 20000, 30000],
      ['2026-08-06', 20000, 27000],
      ['2026-08-07', 23000, 37000],
      ['2026-08-08', 23000, 40000],
      ['2026-08-09', 23000, 44000],
    ].map(([date, singles, sealed]) => ({ date, singles, sealed, other: 0 })),
    kpiHistory: ['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09'].map(
      (date, index) => ({
        date, gmv: 37000 + index * 5000, netProfit: 1100 + index * 150, commission: 1100 + index * 150,
        remainingStock: 7000 - index * 100,
      }),
    ),
    gameDistribution: [
      { game: 'Pokémon', gameSlug: 'pokemon', gmv: 240000, netProfit: 7200, remainingStock: 2469, percentage: 56 },
      { game: 'One Piece', gameSlug: 'one-piece', gmv: 103500, netProfit: 3105, remainingStock: 1970, percentage: 24 },
      { game: 'Other TCG', gameSlug: 'other-tcg', gmv: 85000, netProfit: 2550, remainingStock: 1745, percentage: 20 },
    ],
    breakdownByGameAndType: [
      row('Pokémon', 'pokemon', 'SINGLE_CARD', 'การ์ดเดี่ยว', [2350, 610, 1740], 146800, 'NORMAL', 'ปกติ'),
      row('Pokémon', 'pokemon', 'SEALED', 'กล่อง/ซองสุ่ม', [1149, 420, 729], 93200, 'FAST_MOVING', 'สต็อกหมุนเวียนเร็ว'),
      row('One Piece', 'one-piece', 'SINGLE_CARD', 'การ์ดเดี่ยว', [1820, 245, 1575], 64300, 'NORMAL', 'ปกติ'),
      row('One Piece', 'one-piece', 'SEALED', 'กล่อง/ซองสุ่ม', [540, 145, 395], 39200, 'LOW_STOCK', 'สต็อกต่ำ'),
      row('Other TCG', 'other-tcg', 'SINGLE_CARD', 'การ์ดเดี่ยว', [1795, 50, 1745], 85000, 'NORMAL', 'ปกติ'),
    ],
    totals: {
      initialStock: 7654, soldCount: 1470, remainingStock: 6184, singleCards: 4500, sealedBoxes: 1684, otherItems: 0,
      gmv: 428500, weeklyGmv: 428500, commission: 12855, commissionCollected: 12855, netProfit: 12855,
    },
  };

  const emptyReport = {
    ...report,
    startDate: '2026-08-10',
    endDate: '2026-08-16',
    hasData: false,
    summary: {
      gmv: 0, weeklyGmv: 0, commission: 0, commissionCollected: 0, netProfit: 0,
      initialStock: 0, soldCount: 0, remainingStock: 0, stockDepleted: 0, wowChangePercent: 0,
    },
    chartData: report.chartData.map(({ date }) => ({ date, singles: 0, sealed: 0, other: 0 })),
    kpiHistory: report.kpiHistory.map(({ date }) => ({ date, gmv: 0, netProfit: 0, commission: 0, remainingStock: 0 })),
    gameDistribution: [],
    breakdownByGameAndType: [],
    totals: {
      initialStock: 0, soldCount: 0, remainingStock: 0, singleCards: 0, sealedBoxes: 0, otherItems: 0,
      gmv: 0, weeklyGmv: 0, commission: 0, commissionCollected: 0, netProfit: 0,
    },
  };

  const envelope = (data: unknown) => ({ statusCode: 200, body: { success: true, data } });

  const signIn = (user: typeof adminUser) => {
    cy.intercept('POST', '**/api/v1/auth/refresh', envelope({ tokens: { accessToken: 'token', expiresIn: 3600 } }));
    cy.intercept('GET', '**/auth/me*', envelope(user)).as('getMe');
  };

  beforeEach(() => {
    cy.viewport(1440, 1100);
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept('GET', '**/api/v1/cart*', envelope({ id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 }));
    cy.intercept('GET', '**/api/v1/admin/games', envelope([
      { id: 1, name: 'Pokémon', slug: 'pokemon', active: true },
      { id: 2, name: 'One Piece', slug: 'one-piece', active: true },
      { id: 3, name: 'Other TCG', slug: 'other-tcg', active: true },
    ]));
  });

  const stubReport = () => {
    cy.intercept('GET', `${API}?*`, (req) => {
      req.reply(envelope(req.query.startDate === '2026-08-10' ? emptyReport : report));
    }).as('getReport');
  };

  it('redirects non-admin users away from the report', () => {
    signIn(buyerUser);
    cy.visit(ROUTE);
    cy.url().should('not.include', '/admin');
  });

  it('shows the same figures as the API response and refetches on filter changes', () => {
    signIn(adminUser);
    stubReport();
    cy.visit(`${ROUTE}?week=2026-08-03`);

    // เรียกทั้งสัปดาห์ที่เลือกและสัปดาห์ก่อน (ไว้คำนวณป้ายเทียบ) ลำดับไม่แน่นอน
    cy.wait(['@getReport', '@getReport']).then((calls) => {
      const urls = calls.map((call) => call.request.url);
      expect(urls.some((url) => url.includes('startDate=2026-08-03&endDate=2026-08-09'))).to.equal(true);
      expect(urls.some((url) => url.includes('startDate=2026-07-27&endDate=2026-08-02'))).to.equal(true);
    });
    cy.contains('h1', 'รายงานสต็อกและกำไรรายสัปดาห์').should('be.visible');
    cy.contains('a', 'รายงานสต็อก/กำไรรายสัปดาห์').should('have.attr', 'href', ROUTE);

    cy.contains('p', 'กำไรสุทธิสัปดาห์นี้').parents('[data-slot="card"]').within(() => {
      cy.contains('THB 12,855.00');
    });
    cy.contains('p', 'ยอดขายรวมรายสัปดาห์').parents('[data-slot="card"]').within(() => {
      cy.contains('THB 428,500.00');
      cy.contains('+18.2%');
      cy.contains('1,470 รายการ');
    });
    cy.contains('p', 'สต็อกที่เปิดขายอยู่').parents('[data-slot="card"]').within(() => {
      cy.contains('6,184');
      cy.contains('การ์ดเดี่ยว 4,500 · กล่อง/ซองสุ่ม 1,684');
    });
    cy.contains('td', 'รวมทั้งหมด').parent().within(() => {
      cy.contains('7,654');
      cy.contains('THB 428,500.00');
    });
    cy.contains('td', 'Other TCG').parent().contains('1,745');
    cy.contains('td', 'One Piece').parent().next().contains('สต็อกต่ำ');
    cy.contains('56%').should('be.visible');
    cy.screenshot('weekly-report-data', { capture: 'fullPage' });

    cy.contains('button', 'ทุกเกม').click();
    cy.contains('button', 'One Piece').click();
    cy.url().should('include', 'game=one-piece');
    cy.get('@getReport.all').should((calls) => {
      const urls = (calls as unknown as { request: { url: string } }[]).map((call) => call.request.url);
      expect(urls.some((url) => url.includes('startDate=2026-08-03') && url.includes('gameCategory=one-piece'))).to.equal(true);
    });

    cy.contains('button', /สัปดาห์ที่/).click();
    cy.screenshot('weekly-report-week-menu');
    cy.contains('button', 'กำหนดช่วงสัปดาห์เอง').should('be.visible');
  });

  it('shows an empty state with zeroed cards for a week without data', () => {
    signIn(adminUser);
    stubReport();
    cy.visit(`${ROUTE}?week=2026-08-10`);

    cy.contains('ไม่พบรายการเคลื่อนไหวสต็อกและกำไรในสัปดาห์ที่เลือก').should('be.visible');
    cy.contains('p', 'สัดส่วนสต็อกและกำไรตามเกม').should('not.exist');
    cy.contains('button', 'ส่งออกรายงาน').should('be.disabled');
    cy.get('body').invoke('text').should('not.match', /NaN|undefined/);
    cy.screenshot('weekly-report-empty', { capture: 'fullPage' });

    cy.contains('button', 'กลับไปสัปดาห์ปัจจุบัน').click();
    cy.url().should('not.include', 'week=');
  });

  it('exports with a loading state, then a success toast', () => {
    signIn(adminUser);
    stubReport();
    cy.intercept('GET', `${API}/export?*`, {
      delay: 400,
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': 'attachment; filename="pegasus_weekly_report_2026_32.csv"',
      },
      body: 'section,date\n',
    }).as('export');
    cy.visit(`${ROUTE}?week=2026-08-03`);

    cy.contains('button', 'ส่งออกรายงาน').click();
    cy.contains('5 หมวดหมู่ (ยอดขายรวม THB 428,500.00)').should('be.visible');
    cy.screenshot('weekly-report-export-dialog');
    cy.contains('button', 'ดาวน์โหลดรายงาน').click();
    cy.contains('button', 'กำลังสร้างไฟล์').should('be.disabled');

    cy.wait('@export').its('request.url').should('match', /format=csv.*datasets=kpi%2Cbreakdown/);
    cy.contains('ดาวน์โหลดรายงานสำเร็จ').should('be.visible');
    cy.get('[data-slot="dialog-content"]').should('not.exist');
  });

  it('saves stock thresholds and refetches the report', () => {
    signIn(adminUser);
    stubReport();
    cy.intercept('GET', `${API}/thresholds`, envelope({ lowStockThreshold: 500, fastMovingPercent: 30, standardCommissionRatePercent: 3 }));
    cy.intercept('PUT', `${API}/thresholds`, envelope({ lowStockThreshold: 800, fastMovingPercent: 30, standardCommissionRatePercent: 3 })).as('saveThresholds');
    cy.visit(`${ROUTE}?week=2026-08-03`);
    cy.contains('p', 'ยอดขายรวมรายสัปดาห์').should('be.visible');

    cy.contains('button', 'ตั้งค่าระบบ').click();
    cy.get('#low-stock-threshold').should('have.value', '500').clear().type('800');
    cy.get('#standard-commission-rate').should('have.value', '3%').and('be.disabled');
    cy.screenshot('weekly-report-settings');
    cy.get('@getReport.all').then((calls) => {
      const before = (calls as unknown as unknown[]).length;
      cy.contains('button', 'บันทึกการตั้งค่า').click();
      cy.wait('@saveThresholds').its('request.body').should('deep.equal', { lowStockThreshold: 800, fastMovingPercent: 30 });
      cy.get('@getReport.all').should('have.length.greaterThan', before);
    });
    cy.contains('บันทึกการตั้งค่าแล้ว').should('be.visible');
    cy.get('[data-slot="dialog-content"]').should('not.exist');
  });

  it('keeps the dialog open with an error toast when export fails', () => {
    signIn(adminUser);
    stubReport();
    cy.intercept('GET', `${API}/export?*`, {
      statusCode: 500,
      body: { success: false, error: { code: 'INTERNAL_ERROR', message: 'boom' } },
    });
    cy.visit(`${ROUTE}?week=2026-08-03`);

    cy.contains('button', 'ส่งออกรายงาน').click();
    cy.contains('button', 'ดาวน์โหลดรายงาน').click();
    cy.contains('ส่งออกรายงานไม่สำเร็จ').should('be.visible');
    cy.get('[data-slot="dialog-content"]').should('be.visible');
  });
});
