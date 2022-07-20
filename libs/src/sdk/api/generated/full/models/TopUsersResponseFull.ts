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
    UserFull,
    UserFullFromJSON,
    UserFullFromJSONTyped,
    UserFullToJSON,
} from './UserFull';
import {
    VersionMetadata,
    VersionMetadataFromJSON,
    VersionMetadataFromJSONTyped,
    VersionMetadataToJSON,
} from './VersionMetadata';

/**
 * 
 * @export
 * @interface TopUsersResponseFull
 */
export interface TopUsersResponseFull {
    /**
     * 
     * @type {number}
     * @memberof TopUsersResponseFull
     */
    latest_chain_block: number;
    /**
     * 
     * @type {number}
     * @memberof TopUsersResponseFull
     */
    latest_indexed_block: number;
    /**
     * 
     * @type {number}
     * @memberof TopUsersResponseFull
     */
    latest_chain_slot_plays: number;
    /**
     * 
     * @type {number}
     * @memberof TopUsersResponseFull
     */
    latest_indexed_slot_plays: number;
    /**
     * 
     * @type {string}
     * @memberof TopUsersResponseFull
     */
    signature: string;
    /**
     * 
     * @type {string}
     * @memberof TopUsersResponseFull
     */
    timestamp: string;
    /**
     * 
     * @type {VersionMetadata}
     * @memberof TopUsersResponseFull
     */
    version: VersionMetadata;
    /**
     * 
     * @type {Array<UserFull>}
     * @memberof TopUsersResponseFull
     */
    data?: Array<UserFull>;
}

