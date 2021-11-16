import React, { useEffect, useState } from "react";
import { CacheSet } from "@swyg/memo";
import styles from './cache-monitor.module.scss';
import { CacheItem, CacheKey } from "../../../dist";
import { getFriendlyTimeLabel } from "../../utils/dateFormatting";
import { useInterval } from "@swyg/corre";

export interface CacheMonitorItem extends CacheItem {
    resolvedValue: any;
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
    const [cacheState, setCacheState] = useState<CacheMonitorItem[]>([]);

    useInterval(() => {
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

        setTimeout(() => {
            setCacheState(nextCacheState.map((cacheStateItem) => ({
                ...cacheStateItem,
                resolvedValue: resolvedPromises[cacheStateItem.key],
            })));
        }); 
    }, 1000)

    /*
    useEffect(() => {
        cache.subscribe((name) => {
            console.log('CHANGE', name);

            if (name !== 'get' && name !== 'setValue') return;

            const { usages } = cache;
            const entries = new Map<CacheKey, CacheItem>(cache.entries());
            const resolvedPromises: Record<CacheKey, any> = {};
            const nextCacheState: CacheMonitorItem[] = usages.map((cacheKey) => {
                const cacheItem = entries.get(cacheKey);

                cacheItem.value.then((value) => {
                    resolvedPromises[cacheKey] = value;
                });
    
                return { ...cacheItem };
            });

            setTimeout(() => {
                setCacheState(nextCacheState.map((cacheStateItem) => ({
                    ...cacheStateItem,
                    resolvedValue: resolvedPromises[cacheStateItem.key],
                })));
            });    
        });
    }, [cache]);
    */

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
                { cacheState.map(({ key, createdAt, lastUsage, resolvedValue }) => (
                    <tr key={ String(key) }>
                        <td>{ key }</td>
                        <td>{ resolvedValue || 'Promise' }</td>
                        <td>{ getFriendlyTimeLabel(createdAt) }</td>
                        <td>{ getFriendlyTimeLabel(lastUsage) }</td>
                        <td>{ cache.isItemExpired(key) ? '💀' : '' }</td>
                    </tr>
                )) }
            </tbody>
        </table>
    );
}