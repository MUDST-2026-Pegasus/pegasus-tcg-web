describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('allows a user to navigate to the login page and see the form', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').contains(/เข้าสู่ระบบ/i).should('exist');
  });

  it('removes the old localStorage token on startup', () => {
    cy.intercept('POST', '**/auth/refresh', { statusCode: 401, body: { success: false } });
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.setItem('pegasus.auth.session', JSON.stringify({
          accessToken: 'old-access', refreshToken: 'old-refresh', accessExpiresAt: Date.now() + 3600000,
        }));
      },
    });
    cy.window().then((win) => {
      expect(win.localStorage.getItem('pegasus.auth.session')).to.equal(null);
    });
  });

  it('shows validation errors when submitting an empty form', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.contains(/กรุณากรอกอีเมล/i).should('be.visible');
    cy.contains(/กรุณากรอกรหัสผ่าน/i).should('be.visible');
  });

  it('allows a user to navigate to the register page', () => {
    cy.visit('/login');
    cy.contains(/สมัครสมาชิก/i).click();
    cy.url().should('include', '/register');
    cy.get('input[name="username"]').should('exist');
    cy.get('input[name="email"]').should('exist');
  });

  it('simulates a successful login flow', () => {
    // Mock the API response for login
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          tokens: { accessToken: 'mock-access', expiresIn: 900 },
          user: { id: '1', email: 'test@example.com', roles: ['BUYER'] }
        }
      }
    }).as('loginRequest');

    // Mock the /auth/me request that happens after login
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: '1', email: 'test@example.com', username: 'testuser', displayName: 'Test User', roles: ['BUYER'] }
      }
    }).as('meRequest');

    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    
    // Should be redirected to home page
    cy.url().should('not.include', '/login');
  });

  it('simulates a successful register flow', () => {
    // Mock the API response for register
    cy.intercept('POST', '**/auth/register', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          tokens: { accessToken: 'mock-access', expiresIn: 900 },
          user: { id: '2', email: 'newuser@example.com', roles: ['BUYER'] }
        }
      }
    }).as('registerRequest');

    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: '2', email: 'newuser@example.com', username: 'newuser', displayName: 'New User', roles: ['BUYER'] }
      }
    }).as('meRequest');

    cy.visit('/register');
    
    // Fill out the registration form
    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="displayName"]').type('New User');
    cy.get('input[name="email"]').type('newuser@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    cy.get('#terms').click({ force: true });
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest');
    
    // Should be redirected or show success
    cy.url().should('not.include', '/register');
  });

  describe('Google Sign-In Flow', () => {
    function stubGoogleGis(win: Cypress.AUTWindow, credential = 'mock-google-id-token') {
      let callbackFn: ((res: { credential?: string }) => void) | undefined;
      win.google = {
        accounts: {
          id: {
            initialize(config) {
              callbackFn = config.callback;
            },
            renderButton(parent) {
              const btn = win.document.createElement('button');
              btn.type = 'button';
              btn.textContent = 'Continue with Google';
              btn.setAttribute('data-cy', 'google-signin-trigger');
              btn.addEventListener('click', () => {
                callbackFn?.({ credential });
              });
              parent.appendChild(btn);
            },
          },
        },
      };
    }

    it('signs in with Google from the Login page and redirects to home', () => {
      cy.intercept('POST', '**/auth/google', (req) => {
        expect(req.body).to.deep.equal({ credential: 'mock-google-id-token' });
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              tokens: { accessToken: 'mock-google-access', tokenType: 'Bearer', expiresIn: 900, refreshExpiresIn: 86400 },
              user: { id: 10, email: 'googleuser@gmail.com', username: 'user_google10', displayName: 'Google User', roles: ['BUYER'] },
            },
          },
        });
      }).as('googleAuthRequest');

      cy.intercept('GET', '**/auth/me', {
        statusCode: 200,
        body: {
          success: true,
          data: { id: 10, email: 'googleuser@gmail.com', username: 'user_google10', displayName: 'Google User', roles: ['BUYER'] },
        },
      }).as('meRequest');

      cy.visit('/login', {
        onBeforeLoad(win) {
          stubGoogleGis(win);
        },
      });

      cy.contains('การดำเนินการต่อถือว่าคุณยอมรับ').should('be.visible');
      cy.get('[data-cy="google-signin-trigger"]').click();

      cy.wait('@googleAuthRequest');
      cy.url().should('not.include', '/login');
    });

    it('signs in with Google from the Register page and redirects to home', () => {
      cy.intercept('POST', '**/auth/google', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            tokens: { accessToken: 'mock-google-access', tokenType: 'Bearer', expiresIn: 900, refreshExpiresIn: 86400 },
            user: { id: 11, email: 'newgoogle@gmail.com', username: 'user_google11', displayName: 'New Google User', roles: ['BUYER'] },
          },
        },
      }).as('googleAuthRequest');

      cy.intercept('GET', '**/auth/me', {
        statusCode: 200,
        body: {
          success: true,
          data: { id: 11, email: 'newgoogle@gmail.com', username: 'user_google11', displayName: 'New Google User', roles: ['BUYER'] },
        },
      }).as('meRequest');

      cy.visit('/register', {
        onBeforeLoad(win) {
          stubGoogleGis(win);
        },
      });

      cy.contains('ฉันยอมรับ').should('be.visible');
      cy.get('[data-cy="google-signin-trigger"]').click();

      cy.wait('@googleAuthRequest');
      cy.url().should('not.include', '/register');
    });

    it('displays ACC-3 alert when Google Sign-In returns an error code', () => {
      cy.intercept('POST', '**/auth/google', {
        statusCode: 409,
        body: {
          success: false,
          message: 'Account cannot be linked automatically',
          data: {
            code: 'GOOGLE_LINK_NOT_ALLOWED',
          },
        },
      }).as('googleAuthError');

      cy.visit('/login', {
        onBeforeLoad(win) {
          stubGoogleGis(win);
        },
      });

      cy.get('[data-cy="google-signin-trigger"]').click();
      cy.wait('@googleAuthError');

      cy.contains('กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน').should('be.visible');
      cy.contains("มีบัญชีที่ใช้อีเมลนี้อยู่แล้ว และผูกกับ Google อัตโนมัติไม่ได้").should('be.visible');
    });
  });
});
