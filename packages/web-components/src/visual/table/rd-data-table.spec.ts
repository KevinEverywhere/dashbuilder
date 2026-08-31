import { registerRdDataTable, RD_DATA_TABLE_TAG, RdDataTableElement } from './rd-data-table.js';

describe('rd-data-table', () => {
  beforeAll(() => {
    registerRdDataTable();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_DATA_TABLE_TAG)).toBe(RdDataTableElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_DATA_TABLE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-table"]') ? el : el.querySelector('[data-testid="rd-table"]');
    expect(root).toBeTruthy();
    el.remove();
  });

  it('renders custom column headers from the columns attribute', () => {
    const el = document.createElement(RD_DATA_TABLE_TAG);
    el.setAttribute(
      'columns',
      JSON.stringify([{ key: 'name', header: 'Matchup' }, { key: 'status', header: 'Status' }]),
    );
    el.setAttribute('rows', JSON.stringify([{ id: '1', name: 'Lakers', status: 'Final' }]));
    document.body.appendChild(el);
    expect(el.querySelector('th')?.textContent).toBe('Matchup');
    el.remove();
  });
});
