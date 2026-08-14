import { FormattedMessage } from '@umijs/max';
import { Badge, Typography } from 'antd';
import React from 'react';
import { getColorPrimary } from '@/utils/global';

const { Paragraph, Text } = Typography;
export type ContinueProps = {
  current: number;
  remainingItemCount: number;
};

const Continue: React.FC<ContinueProps> = (props) => {
  const colorPrimary = getColorPrimary();
  let total = props.current;
  if (props?.remainingItemCount) {
    total = props?.remainingItemCount + props.current;
  }
  if (props.current === 0) {
    return (
      <Paragraph style={{ color: colorPrimary }}>
        <FormattedMessage id="cluster.apiserver.response.data.empty" />
      </Paragraph>
    );
  } else {
    return (
      <>
        <Paragraph style={{ color: colorPrimary, paddingBottom: 0 }}>
          <FormattedMessage id="cluster.apiserver.response.data.current.description" />
          &nbsp;
          <Badge
            style={{ backgroundColor: '#52c41a' }}
            count={props.current}
            overflowCount={10000000}
          />
          &nbsp;
          <FormattedMessage id="cluster.apiserver.response.data.total.description" />
          &nbsp;
          <Badge
            style={{ backgroundColor: '#52c41a' }}
            count={total}
            overflowCount={10000000}
          />
        </Paragraph>
        {props?.remainingItemCount > 0 && (
          <>
            <Paragraph style={{ color: colorPrimary, paddingBottom: 0 }}>
              <FormattedMessage id="cluster.apiserver.response.data.continue.description" />
              &nbsp;
              <Badge
                style={{ backgroundColor: '#52c41a' }}
                count={props.remainingItemCount}
                overflowCount={10000000}
              />
              &nbsp;
              <FormattedMessage id="cluster.apiserver.response.data.filter.description" />
            </Paragraph>
          </>
        )}
      </>
    );
  }
};
export default Continue;
