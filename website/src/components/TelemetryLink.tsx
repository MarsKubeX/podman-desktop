import Link from '@docusaurus/Link';
import type { ReactNode } from 'react';

type TelemetryLinkProps = {
  to: string;
  eventPath: string;
  eventTitle: string;
  className: string;
  children?: ReactNode[];
};

const sendGoatCounterEvent = (path: string, title: string): void => {
  window.goatcounter?.count({
    path: path,
    title: title,
    event: true,
  });
};

export const TelemetryLink = (props: TelemetryLinkProps): JSX.Element => {
  return (
    <Link
      className={props.className}
      to={props.to}
      onClick={() => sendGoatCounterEvent(props.eventPath, props.eventTitle)}>
      {props.children}
    </Link>
  );
};
