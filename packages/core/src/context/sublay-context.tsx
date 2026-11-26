import React, { createContext } from "react";
import useProjectData, {
  UseProjectDataProps,
  UseProjectDataValues,
} from "../hooks/projects/useProjectData";
import { SublayStoreProvider } from "./sublay-store-context";
import { SublayError } from "../errors/SublayError";

export interface SublayContextProps extends UseProjectDataProps {
  signedToken?: string | null | undefined;
  children: React.ReactNode;
}

export interface SublayContextValues extends UseProjectDataValues {}

export const SublayContext = createContext<SublayContextValues>({
  projectId: "",
  project: null,
});

export const SublayProvider: React.FC<SublayContextProps> = ({
  projectId,
  signedToken,
  children,
}: SublayContextProps) => {
  const data = useProjectData({ projectId });

  if (!projectId)
    throw new SublayError("projectId in SublayProvider is " + typeof projectId);

  return (
    <SublayContext.Provider value={data}>
      <SublayStoreProvider projectId={projectId} signedToken={signedToken}>
        {children}
      </SublayStoreProvider>
    </SublayContext.Provider>
  );
};
