import React, { useCallback, useEffect, useState } from "react";
import { memoCacheKey } from "@swyg/memo";
import styles from './home.module.scss';
import { CacheMonitor } from "../../cache-monitor/cache-monitor.componen";
import { CacheItem } from "@swyg/memo";
import { getFriendlyTimeLabel } from "../../../utils/dateFormatting";

function sleep(wait: number) {
    return new Promise(resolve => setTimeout(resolve, wait));
}

async function fakeFetch(param1: string, param2: string) {
    await sleep(2000 + Math.random() * 2000);

    return new Promise((resolve) => {
        resolve(`${ param1 } | ${ param2 }`);
    });  
}

const memoFakeFetch = memoCacheKey(fakeFetch, {
    keepPromises: true,
    slots: 8,  
    maxAge: 10000,
});

const cacheProxy = memoFakeFetch.cache;

function getObservableCache() {
    let callback= (name: string) => undefined;

    const proxy = new Proxy(cacheProxy, {
        get(target, name/*, receiver*/) {
            let ret = Reflect.get(target, name);
    
            // console.log(`get(${ String(name) }=${ ret })`);   

            callback(String(name));
    
            if (typeof ret === "function") {    
              ret = ret.bind(target);         
            }                    
    
            return ret;
         },
    
         set(target, name, value/*, receiver*/) {
             // console.log(`set(${ String(name) }=${ value })`);

             callback(String(name));
    
             return Reflect.set(target, name, value);
         },
    });

    (proxy as any).subscribe = (nextCallback: (name: string) => void) => {
        callback = nextCallback;
    };

    return proxy;
}

memoFakeFetch.cache = getObservableCache();

interface FormState {
    param1: string;
    param2: string;
}

interface FormState {
    param1: string;
    param2: string;
}

interface ServiceState extends CacheItem {
    isLoading: boolean;
}

export const HomePage: React.FC = () => {
    const [formState, setFormState] = useState<FormState>({
        param1: '',
        param2: '',
    });

    const [serviceState, setServiceState] = useState<ServiceState>({
        key: '',
        value: '',
        lastUsage: 0,
        createdAt: 0,
        isLoading: false,
    });

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {        
        setFormState((prevFormState) => ({ ...prevFormState, [e.target.name]: e.target.value }));        
    }, []);

    const handleReloadClicked = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {       
        const cacheItem = memoFakeFetch.refreshCacheItem(formState.param1, formState.param2);

        console.log('cacheItem', cacheItem);

        if (!cacheItem) return;

        setServiceState({
            ...cacheItem,
            isLoading: true,
        });

        cacheItem.value.then((value) => {
            setServiceState((prevState) => {
                return prevState.key === cacheItem.key ? {
                    ...cacheItem,
                    value,
                    isLoading: false,
                } : prevState;
            });
        });     
    }, [formState]);

    useEffect(() => {
        if (!formState.param1 || !formState.param2) return;

        const cacheItem = memoFakeFetch.getCacheItem(formState.param1, formState.param2);

        console.log('cacheItem', cacheItem);

        if (!cacheItem) return;

        setServiceState({
            ...cacheItem,
            isLoading: true,
        });

        cacheItem.value.then((value) => {
            setServiceState((prevState) => {
                return prevState.key === cacheItem.key ? {
                    ...cacheItem,
                    value,
                    isLoading: false,
                } : prevState;
            });
        });

    }, [formState]);

    /* 

        <ul>
            <li>Both search fields are required.</li>
            <li>All requests will be sent to multiple endpoints, one at a time.</li>
            <li>For each param combination, one, multiple or no endpoints will return a response.</li>
            <li>If multiple endpoints can return a response, they will match.</li>
            <li>Users should know if the result is fresh or from the cache.</li>
            <li>Users should know when the result was first fetched or "touched".</li>
            <li>Users should be able to re-fetch their search.</li>
            <li>Cached results expire in 30 seconds.</li>
            <li>Cached results are persisted between page reloads.</li>
            <li>The app should work fine even with out-of-order responses.</li>
        </ul>

    */

    return (
        <div className={ styles.base }>
            <div className={ styles.dashboard }>            
                <div className={ styles.controls }>
                    <select className={ styles.select } name="param1" onChange={ handleInputChange } value={ formState.param1 }>
                        <option value=""></option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>

                    <select className={ styles.select } name="param2" onChange={ handleInputChange }>
                        <option value=""></option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>

                    { serviceState.key !== '' && (
                        <div className={ styles.dates }>
                            <span className={ styles.date }>
                                <span className={ styles.dateIcon }>💾</span>
                                <span className={ styles.dateText }>Created { getFriendlyTimeLabel(serviceState.createdAt) } ago</span>
                            </span>

                            <span className={ styles.date }>
                                <span className={ styles.dateIcon }>👀</span>
                                <span className={ styles.dateText }>Last used { getFriendlyTimeLabel(serviceState.lastUsage) } ago</span>
                            </span>

                            { serviceState.isLoading && (
                                <span className={ styles.date }>
                                    <span className={ `${ styles.dateIcon } ${ styles.iconSpin }` }>📀</span>
                                    <span className={ styles.dateText }>Loading...</span>
                                </span>
                            ) }

                            { !serviceState.isLoading && serviceState.createdAt !== serviceState.lastUsage && (
                                <span className={ styles.date }>
                                    <span className={ styles.dateIcon }>🎯</span>
                                    <span className={ styles.dateText }>Loaded from cache</span>
                                    <button className={ styles.dataButton } onClick={ handleReloadClicked }>Reload</button>
                                </span>
                            ) }

                            { !serviceState.isLoading && serviceState.createdAt === serviceState.lastUsage && (
                                <span className={ styles.date }>
                                    <span className={ styles.dateIcon }>🥬</span>
                                    <span className={ styles.dateText }>Fresh!</span>
                                    <button className={ styles.dataButton } onClick={ handleReloadClicked }>Reload</button>
                                </span>
                            ) }

                            { !serviceState.isLoading && (
                                <span className={ styles.date }>
                                    <span className={ styles.dateIcon }>📦</span>
                                    <span className={ styles.dateText }>Response = { serviceState.value }</span>
                                </span>
                            ) }
                        </div>
                    ) }

                    { /* <pre>{ JSON.stringify(serviceState, null, 2) }</pre> */ }
                </div>

                <div className={ styles.cache }>
                    <CacheMonitor cache={ cacheProxy as any } />
                </div>
            </div>

        </div>
    );
}