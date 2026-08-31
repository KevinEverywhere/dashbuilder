import { Children, cloneElement, forwardRef, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';

export type FlexDensity = 'comfortable' | 'compact';

export interface FlexLayoutProps {
  title?: string;
  direction?: 'row' | 'column';
  gap?: number | string;
  density?: FlexDensity;
  /** Per-child flex grow weights (e.g. [1.4, 1] for table + detail). */
  itemFlex?: number[];
  stretchItems?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** @rosettadash/react/layout/flex — layout.flex */
export const FlexLayout = forwardRef<HTMLElement, FlexLayoutProps>(function FlexLayout(
  props,
  ref,
) {
  const { className, style, children, itemFlex, stretchItems, density } = props;
  const rootClass = [
    'rd-flex',
    stretchItems ? 'rd-flex--stretch-items' : '',
    density === 'compact' ? 'rd-flex--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const childArray = Children.toArray(children);
  const wrappedChildren = childArray.map((child, index) => {
    if (!isValidElement(child)) {
      return child;
    }
    const grow = itemFlex?.[index];
    const itemStyle =
      grow !== undefined
        ? ({ '--rd-flex-grow': String(grow) } as CSSProperties)
        : undefined;
    const itemClass = grow !== undefined ? 'rd-flex__item rd-flex__item--grow' : 'rd-flex__item';
    return cloneElement(child as ReactElement<{ className?: string; style?: CSSProperties }>, {
      className: [itemClass, (child as ReactElement<{ className?: string }>).props.className]
        .filter(Boolean)
        .join(' '),
      style: { ...((child as ReactElement<{ style?: CSSProperties }>).props.style ?? {}), ...itemStyle },
    });
  });

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="rd-flex">
      {props.title ? <span className="rd-flex__title">{props.title}</span> : null}
      <div className="rd-flex__flex" style={{ flexDirection: props.direction ?? 'row', gap: props.gap ?? 12 }}>
        {wrappedChildren}
      </div>
    </section>
  );
});
