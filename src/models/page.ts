import { Effect } from 'dva';
import { Reducer } from 'redux';

import { queryPageLayout, postPageAction } from '@/services/page';

type PageElementDataType = object;
export interface PageElement {
    id?: string;
    type: string;
    name?: string;
    uuid?: string;
    title?: string;
    content?: PageElement[];
    data?: PageElementDataType;
    requiredMessage?: string;
    placeholder?: string;

    columns?: any[];
    style?: string;
    row_actions?: PageElement[];
    table_actions?: PageElement[];
    link_to?: string | null;
    icon?: string;

    on_submit?: string;
    on_click?: string;
    on_data?: string;
}

export interface PageModelState {
    pageLayout: {
        content: PageElement[];
    }
}

export interface PageModelType {
    namespace: 'page';
    state: PageModelState;
    effects: {
        fetch: Effect;
        submitAction: Effect;
        requestDataUpdate: Effect;
    };
    reducers: {
        savePageLayout: Reducer<PageModelState>;
        updateElementData: Reducer<PageModelState>;
        updateElement: Reducer<PageModelState>;
    }
}

const PageModel: PageModelType = {
    namespace: 'page',

    state: {
        pageLayout: { content: [] }
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const response = yield call(queryPageLayout, payload);
            yield put({
                type: 'savePageLayout', 
                payload: response,
            });
        },

        *submitAction({ payload }, { call, put }) {
            yield call(postPageAction, payload);
        },

        *requestDataUpdate({ payload }, { call, put }) {
            const response = yield call(postPageAction, payload);
            yield put({
                type: 'updateElementData', 
                payload: {
                    uuid: payload.uuid,
                    newData: response
                }
            });
        },
    },

    reducers: {
        savePageLayout(state, action) {
            return {
                ...state, 
                pageLayout: action.payload || {},
            };
        },

        updateElementData(state, action) {
            const switchElement = (els:PageElement[], uuid:string, 
                newData: PageElementDataType): PageElement[] => {
                return els.map(el=>{
                    if(el.uuid == uuid && el.data) {
                        return {...el, data: newData}
                    }
                    else if(el.content) {
                        return {
                            ...el, 
                            content:switchElement(el.content, uuid, newData)
                        };
                    }
                    else {
                        return el;
                    }
                })
            }

            return {
                ...state, 
                pageLayout: {
                    content: switchElement(state?.pageLayout.content || [], 
                        action.payload.uuid, action.payload.newData)
                } 
            };
        },


        // replace page element by id.
        // this is not used... yet.
        updateElement(state, action) {
            const switchElement = (els:PageElement[], id:string, 
                updater:(el:PageElement)=>PageElement): PageElement[] => {
                return els.map(el=>{
                    if(el.id == id) {
                        return updater(el);
                    }
                    else if(el.content) {
                        return {
                            ...el, 
                            content:switchElement(el.content, id, updater)
                        };
                    }
                    else {
                        return el;
                    }
                })
            }

            return {
                ...state, 
                pageLayout: {
                    content: switchElement(state?.pageLayout.content || [], 
                        action.payload.id, action.payload.updater)
                } 
            };
        }
    }
}

export default PageModel;