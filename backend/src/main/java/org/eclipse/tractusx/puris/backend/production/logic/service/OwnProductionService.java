/*
Copyright (c) 2024 Volkswagen AG
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

package org.eclipse.tractusx.puris.backend.production.logic.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Stream;

import javax.management.openmbean.KeyAlreadyExistsException;

import org.eclipse.tractusx.puris.backend.masterdata.domain.model.Partner;
import org.eclipse.tractusx.puris.backend.masterdata.logic.service.PartnerService;
import org.eclipse.tractusx.puris.backend.production.domain.model.OwnProduction;
import org.eclipse.tractusx.puris.backend.production.domain.repository.OwnProductionRepository;
import org.springframework.stereotype.Service;

@Service
public class OwnProductionService {
    private final OwnProductionRepository repository;

    private final PartnerService partnerService;

    protected final Function<OwnProduction, Boolean> validator;

    public OwnProductionService(OwnProductionRepository repository, PartnerService partnerService) {
        this.repository = repository;
        this.partnerService = partnerService;
        this.validator = this::validate;
    }

    public final List<OwnProduction> findAll() {
        return repository.findAll();
    }

    public final List<OwnProduction> findAllByBpnl(String bpnl) {
        return repository.findAll().stream().filter(production -> production.getPartner().getBpnl().equals(bpnl))
                .toList();
    }

    public final List<OwnProduction> findAllByOwnMaterialNumber(String ownMaterialNumber) {
        return repository.findAll().stream().filter(production -> production.getMaterial().getOwnMaterialNumber().equals(ownMaterialNumber))
                .toList();
    }

    public final List<OwnProduction> findAllByFilters(
        Optional<String> ownMaterialNumber,
        Optional<String> bpnl,
        Optional<String> bpns,
        Optional<Date> estimatedTimeOfCompletion) {
        Stream<OwnProduction> stream = repository.findAll().stream();
        if (ownMaterialNumber.isPresent()) {
            stream = stream.filter(production -> production.getMaterial().getOwnMaterialNumber().equals(ownMaterialNumber.get()));
        }
        if (bpnl.isPresent()) {
            stream = stream.filter(production -> production.getPartner().getBpnl().equals(bpnl.get()));
        }
        if (bpns.isPresent()) {
            stream = stream.filter(production -> production.getProductionSiteBpns().equals(bpns.get()));
        }
        if (estimatedTimeOfCompletion.isPresent()) {
            LocalDate localEstimatedTimeOfCompletion = Instant.ofEpochMilli(estimatedTimeOfCompletion.get().getTime())
                .atOffset(ZoneOffset.UTC)
                .toLocalDate();
            stream = stream.filter(production -> {
                LocalDate productionEstimatedTimeOfCompletion = Instant.ofEpochMilli(production.getEstimatedTimeOfCompletion().getTime())
                    .atOffset(ZoneOffset.UTC)
                    .toLocalDate();
                return productionEstimatedTimeOfCompletion.getDayOfMonth() == localEstimatedTimeOfCompletion.getDayOfMonth();
            });
        }
        return stream.toList();
    }

    public final OwnProduction findById(UUID uuid) {
        return repository.findById(uuid).orElse(null);
    }

    public final List<Double> getQuantityForDays(String material, String partnerBpnl, String siteBpns, int numberOfDays) {
        List<Double> quantities = new ArrayList<>();
        LocalDate localDate = LocalDate.now();

        for (int i = 0; i < numberOfDays; i++) {
            Date date = Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
            List<OwnProduction> productions = findAllByFilters(Optional.of(material), Optional.of(partnerBpnl), Optional.of(siteBpns), Optional.of(date));
            double productionQuantity = getSumOfQuantities(productions);
            quantities.add(productionQuantity);

            localDate = localDate.plusDays(1);
        }
        return quantities;
    }

    public final OwnProduction create(OwnProduction production) {
        if (!validator.apply(production)) {
            
            throw new IllegalArgumentException("Invalid production");
        }
        if (repository.findAll().stream().anyMatch(prod -> prod.equals(production))) {
            throw new KeyAlreadyExistsException("Production already exists");
        }
        return repository.save(production);
    }

    public final List<OwnProduction> createAll(List<OwnProduction> productions) {
        if (productions.stream().anyMatch(production -> !validator.apply(production))) {
            throw new IllegalArgumentException("Invalid production");
        }
        if (repository.findAll().stream()
                .anyMatch(existing -> productions.stream().anyMatch(production -> production.equals(existing)))) {
            throw new KeyAlreadyExistsException("Production already exists");
        }
        return repository.saveAll(productions);
    }

    public final OwnProduction update(OwnProduction production) {
        if (production.getUuid() == null || repository.findById(production.getUuid()).isEmpty()) {
            return null;
        }
        return repository.save(production);
    }

    public final void delete(UUID uuid) {
        repository.deleteById(uuid);
    }

    public boolean validate(OwnProduction production) {
        Partner ownPartnerEntity = partnerService.getOwnPartnerEntity();
        return 
            production.getQuantity() > 0 && 
            production.getMeasurementUnit() != null && 
            production.getEstimatedTimeOfCompletion() != null && 
            production.getMaterial() != null &&
            production.getPartner() != null &&
            !production.getPartner().equals(ownPartnerEntity) &&
            production.getProductionSiteBpns() != null &&
            ownPartnerEntity.getSites().stream().anyMatch(site -> site.getBpns().equals(production.getProductionSiteBpns())) &&
            ((
                production.getCustomerOrderNumber() != null && 
                production.getCustomerOrderPositionNumber() != null
            ) || (
                production.getCustomerOrderNumber() == null && 
                production.getCustomerOrderPositionNumber() == null && 
                production.getSupplierOrderNumber() == null
            ));
    }

    private final double getSumOfQuantities(List<OwnProduction> productions) {
        double sum = 0;
        for (OwnProduction production : productions) {
            sum += production.getQuantity();
        }
        return sum;
    }
}
