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

import { config } from '../../../models/constants/config';
import { ProductDescriptor } from '../../../models/types/data/product-descriptor';
import { useFetch } from '../../../hooks/useFetch';

export function useProducts() {
    const {
        data: products,
        error: productsError,
        isLoading: isLoadingProducts,
    } = useFetch<ProductDescriptor[]>(config.app.BACKEND_BASE_URL + config.app.ENDPOINT_PRODUCTS);
    return {
        products,
        productsError,
        isLoadingProducts,
    };
}