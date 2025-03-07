// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
/**
 * API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import {
    StemFull,
    StemFullFromJSON,
    StemFullFromJSONTyped,
    StemFullToJSON,
} from './StemFull';
import {
    VersionMetadata,
    VersionMetadataFromJSON,
    VersionMetadataFromJSONTyped,
    VersionMetadataToJSON,
} from './VersionMetadata';

/**
 * 
 * @export
 * @interface StemsResponse
 */
export interface StemsResponse {
    /**
     * 
     * @type {number}
     * @memberof StemsResponse
     */
    latest_chain_block: number;
    /**
     * 
     * @type {number}
     * @memberof StemsResponse
     */
    latest_indexed_block: number;
    /**
     * 
     * @type {number}
     * @memberof StemsResponse
     */
    latest_chain_slot_plays: number;
    /**
     * 
     * @type {number}
     * @memberof StemsResponse
     */
    latest_indexed_slot_plays: number;
    /**
     * 
     * @type {string}
     * @memberof StemsResponse
     */
    signature: string;
    /**
     * 
     * @type {string}
     * @memberof StemsResponse
     */
    timestamp: string;
    /**
     * 
     * @type {VersionMetadata}
     * @memberof StemsResponse
     */
    version: VersionMetadata;
    /**
     * 
     * @type {Array<StemFull>}
     * @memberof StemsResponse
     */
    data?: Array<StemFull>;
}

