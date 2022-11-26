import React, { useCallback, useEffect, useState } from "react";
import { CacheSet } from "@swyg/memo";
import styles from './cache-monitor.module.scss';
import { CacheItem, CacheKey } from "../../../dist";
import { getFriendlyTimeLabel } from "../../utils/dateFormatting";
import { useInterval } from "@swyg/corre";

export interface CacheMonitorItem extends CacheItem {
    resolvedValue?: any;
}

export interface CacheMonitorProps {
    className?: string;
    cache: CacheSet & { subscribe: (callback: (name) => void) => void };
}

export const CacheMonitor: React.FC<CacheMonitorProps> = ({
    className,
    cache
}) => {
    const [now, setNow] = useState(Date.now());
    const [cacheState, setCacheState] = useState<CacheMonitorItem[]>([ ...Array(cache.slots).fill({}) ]);

    const syncCacheState = useCallback(() => {
        setNow(Date.now());
        
        // console.log('CHANGE', name);

        // if (name !== 'get' && name !== 'setValue') return;

        const { usages } = cache;
        const entries = new Map<CacheKey, CacheItem>(cache.entries());
        const resolvedPromises: Record<CacheKey, any> = {};
        const nextCacheState: CacheMonitorItem[] = usages.map((cacheKey) => {
            const cacheItem = entries.get(cacheKey);

            cacheItem.value.then((value) => {
                resolvedPromises[cacheKey] = value;
            });

            return { ...cacheItem };
        }).reverse();

        if (nextCacheState.length < cache.slots) nextCacheState.push(...Array(cache.slots - nextCacheState.length).fill({ }));

        setTimeout(() => {
            setCacheState(nextCacheState.map((cacheStateItem) => ({
                ...cacheStateItem,
                resolvedValue: resolvedPromises[cacheStateItem.key],
            })));
        }); 
    }, [cache])

    useInterval(() => {
        syncCacheState();
    }, 1000, [syncCacheState]);

    useEffect(() => {
        // TODO: Return unsubscribe function and implement proper pub-sub:
        return cache.subscribe((name) => {
            console.log('CHANGE', name);

            if (name !== 'get' && name !== 'setValue') return;

            syncCacheState();
        });
    }, [cache, syncCacheState]);

    return (       
        <table className={ styles.base }>
            <thead>
                <tr>
                    <th>Key</th>
                    <th>Result</th>
                    <th>Created At</th>
                    <th>Last Usage</th>
                    <th></th>
                </tr>
            </thead>

            <tbody>
                { cacheState.map(({ key, createdAt, lastUsage, resolvedValue }, i) => {
                    return key ? (
                        <tr key={ String(key) }>
                            <td>{ key }</td>
                            <td>{ resolvedValue || 'Promise' }</td>
                            <td>{ getFriendlyTimeLabel(createdAt) }</td>
                            <td>{ getFriendlyTimeLabel(lastUsage) }</td>
                            <td>{ cache.isItemExpired(key) ? '💀' : '' }</td>
                        </tr>
                    ) : (
                        <tr key={ i }>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td></td>
                        </tr>
                    );
                }) }
            </tbody>
        </table>
    );
}