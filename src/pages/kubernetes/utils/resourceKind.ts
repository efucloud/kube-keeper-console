import type { IntlShape } from 'react-intl';

const resourceKindMessageIds: Record<string, string> = {};

export const formatResourceKind = (intl: IntlShape, kind: string) => {
  const messageId = resourceKindMessageIds[kind];
  if (!messageId) {
    return kind;
  }
  return intl.formatMessage({ id: messageId, defaultMessage: kind });
};
