describe('Admin CSV export for orders and users [TCG-749]', () => {
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

  const envelope = (data: unknown) => ({ statusCode: 200, body: { success: true, data } });
  const csvReply = (filename: string) => ({
    delay: 400,
    statusCode: 200,
    headers: {
      'Content-Type': 'text/csv; charset=UTF-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: '﻿"id"\r\n',
  });
  const tooLarge = {
    statusCode: 400,
    // รูปแบบเดียวกับ GlobalExceptionHandler: code อยู่ใน data
    body: {
      success: false,
      message: 'Too many rows',
      data: { code: 'EXPORT_TOO_LARGE', details: { rows: 20001, maxRows: 20000 } },
    },
  };

  const emptyColumn = (key: string, statuses: string[]) => ({ key, statuses, count: 0, items: [] });
  const board = {
    columns: [
      emptyColumn('PENDING_PAYMENT', ['PENDING_PAYMENT']),
      emptyColumn('AWAITING_SHIPMENT', ['PAID', 'PREPARING']),
      emptyColumn('IN_TRANSIT', ['SHIPPED', 'DELIVERED']),
      emptyColumn('COMPLETED', ['COMPLETED']),
      emptyColumn('DISPUTED', ['RETURN_REQUESTED']),
    ],
    alerts: { openDisputeCount: 0, overduePaymentCount: 0, paymentTimeoutMinutes: 60 },
  };
  const userRow = {
    id: 1, email: 'somchai@test.com', username: 'somchai_s', displayName: 'Somchai S', bio: null,
    phone: null, phonePublic: false, avatarUrl: null, bannerUrl: null, status: 'ACTIVE', roles: ['SELLER'],
    createdAt: '2026-01-01T00:00:00Z', lastLoginAt: null,
  };

  beforeEach(() => {
    cy.viewport(1440, 1100);
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept('GET', '**/api/v1/cart*', envelope({ id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 }));
    cy.intercept('POST', '**/api/v1/auth/refresh', envelope({ tokens: { accessToken: 'token', expiresIn: 3600 } }));
    cy.intercept('GET', '**/auth/me*', envelope(adminUser));
  });

  describe('orders', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/admin/orders/board*', envelope(board));
    });

    it('exports the picked range and status with a loading state', () => {
      cy.intercept('GET', '**/api/v1/admin/orders/export*', csvReply('admin-orders-2026-11-01-2026-11-10.csv')).as('export');
      cy.visit('/admin/orders');

      cy.contains('button', 'ส่งออก CSV').click();
      cy.get('#order-export-from').clear().type('2026-11-01');
      cy.get('#order-export-to').clear().type('2026-11-10');
      cy.contains('label', 'ทุกสถานะ').click();
      cy.contains('label', 'ชำระแล้ว').click();
      cy.screenshot('admin-orders-export-dialog');
      cy.contains('button', 'ดาวน์โหลด CSV').click();
      cy.contains('button', 'กำลังสร้างไฟล์').should('be.disabled');

      cy.wait('@export').its('request.query').should('deep.equal', {
        from: '2026-11-01T00:00:00+07:00',
        to: '2026-11-11T00:00:00+07:00',
        status: 'PAID',
      });
      cy.contains('ดาวน์โหลดไฟล์สำเร็จ').should('be.visible');
      cy.get('[data-slot="dialog-content"]').should('not.exist');
    });

    it('keeps the dialog open and explains EXPORT_TOO_LARGE', () => {
      cy.intercept('GET', '**/api/v1/admin/orders/export*', tooLarge);
      cy.visit('/admin/orders');

      cy.contains('button', 'ส่งออก CSV').click();
      cy.contains('button', 'ดาวน์โหลด CSV').click();
      cy.contains('ข้อมูลมากเกินไป กรุณาลดช่วงหรือเพิ่มตัวกรอง').should('be.visible');
      cy.get('[data-slot="dialog-content"]').should('be.visible');
    });
  });

  describe('users', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/admin/users?*', envelope({
        items: [userRow], page: 0, size: 20, totalItems: 1, totalPages: 1,
      }));
    });

    it('sends the current filters without a dialog', () => {
      cy.intercept('GET', '**/api/v1/admin/users/export*', csvReply('admin-users-2026-11-11.csv')).as('export');
      cy.visit('/admin/users?q=som&role=SELLER&status=ACTIVE');

      cy.contains('button', 'ส่งออก CSV').click();
      cy.contains('button', 'กำลังสร้างไฟล์').should('be.disabled');
      cy.wait('@export').its('request.query').should('deep.equal', { q: 'som', role: 'SELLER', status: 'ACTIVE' });
      cy.contains('ดาวน์โหลดไฟล์สำเร็จ').should('be.visible');
      cy.contains('button', 'ส่งออก CSV').should('be.enabled');
    });

    it('shows a toast when the export is too large', () => {
      cy.intercept('GET', '**/api/v1/admin/users/export*', tooLarge);
      cy.visit('/admin/users');

      cy.contains('button', 'ส่งออก CSV').click();
      cy.contains('ข้อมูลมากเกินไป กรุณาลดช่วงหรือเพิ่มตัวกรอง').should('be.visible');
    });
  });
});
