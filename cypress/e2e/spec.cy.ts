describe('template spec', () => {
  it('passes', () => {
    cy.visit('/')
    cy.contains('Pegasus') // change this to text that actually exists if it fails
  })
})
