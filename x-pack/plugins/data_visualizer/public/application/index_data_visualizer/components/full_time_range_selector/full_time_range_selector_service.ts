/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import moment from 'moment';
import type * as estypes from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { TimefilterContract } from 'src/plugins/data/public';
import dateMath from '@elastic/datemath';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import { IndexPattern } from '../../../../../../../../src/plugins/data/public';
import { isPopulatedObject } from '../../../../../common/utils/object_utils';
import { getTimeFieldRange } from '../../services/time_field_range';
import { GetTimeFieldRangeResponse } from '../../../../../common/types/time_field_request';
import { addExcludeFrozenToQuery } from '../../utils/query_utils';

export interface TimeRange {
  from: number;
  to: number;
}

export async function setFullTimeRange(
  timefilter: TimefilterContract,
  indexPattern: IndexPattern,
  query?: QueryDslQueryContainer,
  excludeFrozenData?: boolean
): Promise<GetTimeFieldRangeResponse> {
  const runtimeMappings = indexPattern.getComputedFields()
    .runtimeFields as estypes.MappingRuntimeFields;
  const resp = await getTimeFieldRange({
    index: indexPattern.title,
    timeFieldName: indexPattern.timeFieldName,
    query: excludeFrozenData ? addExcludeFrozenToQuery(query) : query,
    ...(isPopulatedObject(runtimeMappings) ? { runtimeMappings } : {}),
  });
  timefilter.setTime({
    from: moment(resp.start.epoch).toISOString(),
    to: moment(resp.end.epoch).toISOString(),
  });
  return resp;
}

export function getTimeFilterRange(timefilter: TimefilterContract): TimeRange {
  const fromMoment = dateMath.parse(timefilter.getTime().from);
  const toMoment = dateMath.parse(timefilter.getTime().to);
  const from = fromMoment !== undefined ? fromMoment.valueOf() : 0;
  const to = toMoment !== undefined ? toMoment.valueOf() : 0;

  return {
    to,
    from,
  };
}
