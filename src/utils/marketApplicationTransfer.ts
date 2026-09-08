import { saveAs } from 'file-saver';
import * as yaml from 'js-yaml';
import type { MarketApplicationDetail } from '@/services/market_application';
import { exportMarketApplication } from '@/services/market_application.api';

const safeFileName = (name: string) =>
  name.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'application';

export const downloadMarketApplicationYaml = async (
  id: string,
  fallbackName: string,
) => {
  const data = await exportMarketApplication({ id });
  const application = data as MarketApplicationDetail;
  saveAs(
    new Blob([yaml.dump(application, { noRefs: true, lineWidth: 120 })], {
      type: 'application/yaml;charset=utf-8',
    }),
    `${safeFileName(application.name || fallbackName)}.yaml`,
  );
};
