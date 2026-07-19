"use client";

import { useEffect, useState } from "react";
import { Group, LoadingManager } from "three";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import URDFLoader from "urdf-loader";
import { ROBOT_MESH_DIR, ROBOT_URDF } from "@/lib/robot-config";
import type { URDFRobotLike } from "@/types/robot";

interface UrdfState {
  robot: URDFRobotLike | null;
  progress: number;
  error: string | null;
}

/**
 * Loads the BARQ URDF and its Collada meshes.
 *
 * Ported from the reference viewer: URDF is authored Z-up, meshes are addressed
 * by bare filename, so we resolve every mesh by basename against the public mesh
 * directory and hand it to ColladaLoader. Shadows are enabled per-mesh.
 */
export function useUrdf(onProgress?: (p: number) => void): UrdfState {
  const [state, setState] = useState<UrdfState>({
    robot: null,
    progress: 0,
    error: null,
  });

  useEffect(() => {
    let disposed = false;
    let loaded: URDFRobotLike | null = null;
    const manager = new LoadingManager();

    manager.onProgress = (_url, done, total) => {
      const p = total > 0 ? done / total : 0;
      onProgress?.(p);
      if (!disposed) setState((s) => ({ ...s, progress: p }));
    };

    // The URDF completion callback fires before its async Collada meshes finish
    // attaching, so we only publish the robot once the manager drains fully.
    manager.onLoad = () => {
      if (disposed || !loaded) return;
      setState({ robot: loaded, progress: 1, error: null });
    };

    const loader = new URDFLoader(manager);
    loader.loadMeshCb = (path, mgr, done) => {
      const file = path.split(/[\\/]/).pop();
      const url = `${ROBOT_MESH_DIR}/${file}`;
      new ColladaLoader(mgr).load(
        url,
        (res) => {
          const model = res.scene;
          model.traverse((o) => {
            const mesh = o as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
            if (mesh.isMesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          done(model);
        },
        undefined,
        () => done(new Group()),
      );
    };

    loader.load(
      ROBOT_URDF,
      (result) => {
        // Hold the robot; meshes are still streaming in via the manager.
        loaded = result as unknown as URDFRobotLike;
      },
      undefined,
      (err) => {
        if (!disposed) setState((s) => ({ ...s, error: String(err) }));
      },
    );

    return () => {
      disposed = true;
    };
  }, [onProgress]);

  return state;
}
