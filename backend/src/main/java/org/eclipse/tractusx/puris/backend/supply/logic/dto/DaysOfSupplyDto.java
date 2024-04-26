/*
 * Copyright (c) 2024 Volkswagen AG
 * Copyright (c) 2024 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

package org.eclipse.tractusx.puris.backend.supply.logic.dto;

import java.io.Serializable;
import java.util.Date;
import java.util.UUID;

import org.eclipse.tractusx.puris.backend.common.util.PatternStore;

import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class DaysOfSupplyDto implements Serializable {
    private UUID uuid;

    @Pattern(regexp = PatternStore.BPNL_STRING)
    private String partnerBpnl;

    @Pattern(regexp = PatternStore.NON_EMPTY_NON_VERTICAL_WHITESPACE_STRING)
    private String ownMaterialNumber;

    @Pattern(regexp = PatternStore.BPNA_STRING)
    private String stockLocationBPNA;
    
    @Pattern(regexp = PatternStore.BPNS_STRING)
    private String stockLocationBPNS;

    private Date date;
    private double daysOfSupply;
}
