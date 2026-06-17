import React, { createContext, useContext, useMemo, useState } from "react";

const PageTitleContext = createContext({
  pageTitle: "",
  setPageTitle: () => {},
});

export function PageTitleProvider({ children }) {
  const [pageTitle, setPageTitle] = useState("");
  const value = useMemo(
    () => ({ pageTitle, setPageTitle }),
    [pageTitle],
  );
  return (
    <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>
  );
}

export function usePageTitleContext() {
  return useContext(PageTitleContext);
}

/** Set navbar page title while mounted (e.g. dynamic vessel owner name). */
export function usePageTitle(title) {
  const { setPageTitle } = usePageTitleContext();
  React.useEffect(() => {
    setPageTitle(title || "");
    return () => setPageTitle("");
  }, [title, setPageTitle]);
}
