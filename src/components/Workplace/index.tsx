import React from 'react';
import { FormattedMessage } from 'react-intl';
import { getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';

export const WorkplaceIndex: React.FC = () => {
  const colorPrimary = getColorPrimary();
  if (window.location.href.indexOf(`/workplace`) < 0
  ) {
    return (
      <>
        <a
          style={{ color: colorPrimary }}
          onClick={() => {
            window.location.href = normalizeKubernetesPath(`/workplace`);
          }}
        >
          <FormattedMessage id="pages.go.workplace" key='workplace' />
        </a>
      </>
    );
  } else {
    return null;
  }
};

export default WorkplaceIndex;
