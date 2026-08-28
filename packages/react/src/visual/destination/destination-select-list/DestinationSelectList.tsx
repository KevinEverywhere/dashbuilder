import { forwardRef, useEffect, useRef, type CSSProperties } from 'react';

const LIST_TAIL_COUNT = 6;

function findSelectedRow(root: ParentNode | null, selectedId: string): HTMLElement | null {
  const button = root?.querySelector<HTMLElement>(`[data-dest-id="${CSS.escape(selectedId)}"]`);
  return button?.closest('li') ?? button ?? null;
}

export interface DestinationSelectItem {
  id: string;
  label: string;
  meta?: string;
}

export interface DestinationSelectListProps {
  title?: string;
  items: DestinationSelectItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
}

/** @rosettadash/react/visual/destination/destination-select-list — selectable destination sidebar list */
export const DestinationSelectList = forwardRef<HTMLElement, DestinationSelectListProps>(
  function DestinationSelectList({ title = 'Destinations', items, selectedId, onSelect, className, style }, ref) {
    const rootRef = useRef<HTMLElement | null>(null);
    const rootClass = ['rd-destination-list', className].filter(Boolean).join(' ');

    useEffect(() => {
      if (!selectedId) {
        return;
      }
      const index = items.findIndex((item) => item.id === selectedId);
      const row = findSelectedRow(rootRef.current, selectedId);
      row?.scrollIntoView({
        behavior: 'smooth',
        block: index >= 0 && index < items.length - LIST_TAIL_COUNT ? 'start' : 'nearest',
      });
    }, [selectedId, items]);

    return (
      <section
        ref={(node) => {
          rootRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={rootClass}
        style={style}
        aria-label={title}
      >
        <header className="rd-destination-list__header">
          <h3>{title}</h3>
          <span className="rd-destination-list__count">{items.length}</span>
        </header>
        <ul className="rd-destination-list__items">
          {items.map((item) => {
            const selected = item.id === selectedId;
            return (
              <li
                key={item.id}
                className={['rd-destination-list__item', selected ? 'rd-destination-list__item--selected' : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  className="rd-destination-list__button"
                  data-dest-id={item.id}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect?.(item.id)}
                >
                  <span className="rd-destination-list__label">{item.label}</span>
                  {item.meta ? <span className="rd-destination-list__meta">{item.meta}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  },
);
