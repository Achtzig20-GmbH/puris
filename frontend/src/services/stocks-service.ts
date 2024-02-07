/*
Copyright (c) 2024 Volkswagen AG
Copyright (c) 2024 Fraunhofer-Gesellschaft zur Foerderung der angewandten Forschung e.V. (represented by Fraunhofer ISST)
Copyright (c) 2024 Contributors to the Eclipse Foundation

See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This program and the accompanying materials are made available under the
terms of the Apache License, Version 2.0 which is available at
https://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations
under the License.

SPDX-License-Identifier: Apache-2.0
*/

import { config } from '@models/constants/config';
import { MaterialStock, ProductStock } from '@models/types/data/stock';

export const postProductStocks =async (stock: ProductStock) => {
  return fetch(config.app.BACKEND_BASE_URL + config.app.ENDPOINT_PRODUCT_STOCKS, {
    method: 'POST',
    body: JSON.stringify(stock),
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.app.BACKEND_API_KEY,
    },
  });
}

export const putProductStocks = async (stock: ProductStock) => {
  return fetch(config.app.BACKEND_BASE_URL + config.app.ENDPOINT_PRODUCT_STOCKS, {
    method: 'PUT',
    body: JSON.stringify(stock),
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.app.BACKEND_API_KEY,
    },
  });
}

export const postMaterialStocks = async (stock: MaterialStock) => {
  return fetch(config.app.BACKEND_BASE_URL + config.app.ENDPOINT_MATERIAL_STOCKS, {
    method: 'POST',
    body: JSON.stringify(stock),
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.app.BACKEND_API_KEY,
    },
  });
}

export const putMaterialStocks = async (stock: MaterialStock) => {
  return fetch(config.app.BACKEND_BASE_URL + config.app.ENDPOINT_MATERIAL_STOCKS, {
    method: 'PUT',
    body: JSON.stringify(stock),
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.app.BACKEND_API_KEY,
    },
  });
}

export const refreshPartnerStocks = (type: 'material' | 'product', materialNumber: string | null) => {
  const endpoint = type === 'product' ? config.app.ENDPOINT_UPDATE_REPORTED_PRODUCT_STOCKS : config.app.ENDPOINT_UPDATE_REPORTED_MATERIAL_STOCKS;
  return fetch(`${config.app.BACKEND_BASE_URL}${endpoint}${materialNumber}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.app.BACKEND_API_KEY,
    },
  });
}
