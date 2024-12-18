import { generateReactHelpers } from "@uploadthing/react";

export const { useUploadThing, uploadFiles, getRouteConfig } = generateReactHelpers({ url: '/api/private/uploadthing' });