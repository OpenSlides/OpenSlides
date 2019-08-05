type QueryParamValue = string | number | boolean;

/**
 * A key value mapping for params, that should be appended to the url on a new connection.
 */
export interface QueryParams {
    [key: string]: QueryParamValue;
}

/**
 * Formats query params for the url.
 *
 * @param queryParams
 * @returns the formatted query params as string
 */
export function formatQueryParams(queryParams: QueryParams = {}): string {
    let params = '';
    const keys: string[] = Object.keys(queryParams);
    if (keys.length > 0) {
        params =
            '?' +
            keys
                .map(key => {
                    return key + '=' + queryParams[key].toString();
                })
                .join('&');
    }
    return params;
}
