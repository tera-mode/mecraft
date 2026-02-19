'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PageHeaderConfig {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
  rightActionKey?: string | number | boolean;
  hideHeader?: boolean;
}

interface PageHeaderContextType {
  config: PageHeaderConfig;
  setConfig: (config: PageHeaderConfig) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType>({
  config: {},
  setConfig: () => {},
});

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PageHeaderConfig>({});

  return (
    <PageHeaderContext.Provider value={{ config, setConfig }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader(config: PageHeaderConfig) {
  const { setConfig } = useContext(PageHeaderContext);

  useEffect(() => {
    setConfig(config);
    return () => setConfig({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.title, config.showBackButton, config.hideHeader, !!config.rightAction, config.rightActionKey]);
}

export function usePageHeaderConfig() {
  const { config } = useContext(PageHeaderContext);
  return config;
}
