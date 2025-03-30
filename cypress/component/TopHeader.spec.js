beforeEach(() => {
  cy.visit('https://invoicepred.com/creator')
})

describe('Header Component', () => {

  it('renders correctly', () => {
    cy.get('header.desktop-header').should('exist')
  })

  it('allows selecting a language', () => {
    cy.get('[data-testid="select-language"').select('English')
  })

  it('allows selecting a currency', () => {
    cy.get('[data-testid="select-currency"').select('USD')
  })
})

describe('Footer Component', () => {

  it('renders correctly', () => {
    cy.get('footer.desktop-header').should('exist')
  })

  it('link should redirect to Codepred URL on click', () => {
    cy.get('[data-testid="redirect-to-codepred"')
      .contains('Codepred')
      .should('have.attr', 'href')
      .and('include', 'https://codepred.pl/')
  })
})

describe('Creator Component', () => {
  it('renders correctly', () => {
    cy.get('[data-testid="creator-panel"')
  })

  it ('should generate a file when download button is clicked', () => {
    cy.get('[data-testid="download-pdf"]')
      .click()

    cy.wait(2000)

    cy.exec('ls downloads | grep Invoice').then(({ stdout }) => {
      expect(stdout).to.include('Invoice')
    })
  })
})
