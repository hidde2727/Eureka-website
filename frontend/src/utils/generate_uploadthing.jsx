// Almost exact copy of the __useUploadThingInternal from https://github.com/pingdotgg/uploadthing/blob/main/packages/react/src/useUploadThing.ts
// All the code below belongs to UploadThing
// The only change is the onUploadProgress returning fileProgress instead of the uploadProgress

import { useRef, useState, useInsertionEffect  } from "react";

import {
  INTERNAL_DO_NOT_USE__fatalClientError,
  UploadAbortedError,
  UploadThingError
} from "@uploadthing/shared";
import { genUploader } from "uploadthing/client";

/**
 * Render methods should be pure, especially when concurrency is used,
 * so we will throw this error if the callback is called while rendering.
 */
function useEvent_shouldNotBeInvokedBeforeMount() {
    throw new Error(
        "INVALID_USEEVENT_INVOCATION: the callback from useEvent cannot be invoked before the component has mounted.",
    );
}
/**
 * Similar to useCallback, with a few subtle differences:
 * - The returned function is a stable reference, and will always be the same between renders
 * - No dependency lists required
 * - Properties or state accessed within the callback will always be "current"
 */
function useEvent(callback) {
    // Keep track of the latest callback:
    const latestRef = useRef(useEvent_shouldNotBeInvokedBeforeMount);
    useInsertionEffect(() => {
        latestRef.current = callback;
    }, [callback]);
  
    // Create a stable callback that always calls the latest callback:
    // using useRef instead of useCallback avoids creating and empty array on every render
    const stableRef = useRef();
    if (!stableRef.current) {
        stableRef.current = function (THIS) { return latestRef.current.apply(THIS, arguments); };
    }
  
    return stableRef.current;
}
export function useUploadThing(url='/api/private/uploadthing', endpoint='defaultRouter', opts=undefined) {
    const { uploadFiles, routeRegistry } = genUploader({
    url,
    package: "@uploadthing/react",
    });

    const [isUploading, setUploading] = useState(false);
    const uploadProgress = useRef(0);
    const fileProgress = useRef(new Map());

    const startUpload = useEvent(async (...args) => {
        const files = (await opts?.onBeforeUploadBegin?.(args[0])) ?? args[0];
        const input = args[1];

        setUploading(true);
        files.forEach((f) => fileProgress.current.set(f, 0));
        opts?.onUploadProgress?.(0);
        try {
            const res = await uploadFiles(endpoint, {
            signal: opts?.signal,
            headers: opts?.headers,
            files,
            onUploadProgress: (progress) => {
                if (!opts?.onUploadProgress) return;
                const previousProgress = fileProgress.current.get(progress.file?.webkitRelativePath ?? progress.file.name);
                if(previousProgress != undefined && previousProgress == progress.progress) return;
                fileProgress.current.set(progress.file, progress.progress);
                opts?.onUploadProgress?.(progress.file, progress.progress, progress.progress - (previousProgress ?? 0));
            },
            onUploadBegin({ file }) {
                if (!opts?.onUploadBegin) return;

                opts.onUploadBegin(file);
            },
            input
            });

            await opts?.onClientUploadComplete?.(res);
            return res;
        } catch (e) {
            /**
             * This is the only way to introduce this as a non-breaking change
             * TODO: Consider refactoring API in the next major version
             */
            if (e instanceof UploadAbortedError) throw e;

            let error;
            if (e instanceof UploadThingError) {
                error = e;
            } else {
                error = INTERNAL_DO_NOT_USE__fatalClientError(e);
                console.error(
                    "Something went wrong. Please contact UploadThing and provide the following cause:",
                    error.cause instanceof Error ? error.cause.toString() : error.cause,
                );
            }
            await opts?.onUploadError?.(error);
        } finally {
            setUploading(false);
            fileProgress.current = new Map();
            uploadProgress.current = 0;
        }
    });

    return {
        startUpload,
        isUploading
    };
}