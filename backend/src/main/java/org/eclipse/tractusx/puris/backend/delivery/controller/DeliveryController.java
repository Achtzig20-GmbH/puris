/*
 * Copyright (c) 2023 Volkswagen AG
 * Copyright (c) 2023 Fraunhofer-Gesellschaft zur Foerderung der angewandten Forschung e.V.
 * (represented by Fraunhofer ISST)
 * Copyright (c) 2023 Contributors to the Eclipse Foundation
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

package org.eclipse.tractusx.puris.backend.delivery.controller;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.management.openmbean.KeyAlreadyExistsException;

import org.eclipse.tractusx.puris.backend.delivery.domain.model.Delivery;
import org.eclipse.tractusx.puris.backend.delivery.domain.model.OwnDelivery;
import org.eclipse.tractusx.puris.backend.delivery.logic.dto.DeliveryDto;
import org.eclipse.tractusx.puris.backend.delivery.logic.service.OwnDeliveryService;
import org.eclipse.tractusx.puris.backend.delivery.logic.service.ReportedDeliveryService;
import org.eclipse.tractusx.puris.backend.masterdata.domain.model.Material;
import org.eclipse.tractusx.puris.backend.masterdata.domain.model.Partner;
import org.eclipse.tractusx.puris.backend.masterdata.logic.service.MaterialService;
import org.eclipse.tractusx.puris.backend.masterdata.logic.service.PartnerService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("delivery")
@Slf4j
public class DeliveryController {
    @Autowired
    private OwnDeliveryService ownDeliveryService;

    @Autowired
    private ReportedDeliveryService reportedDeliveryService;

    @Autowired
    private MaterialService materialService;

    @Autowired
    private PartnerService partnerService;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private Validator validator;

    @GetMapping()
    @ResponseBody
    @Operation(summary = "Get all planned deliveries for the given Material",
        description = "Get all planned deliveries for the given material number. Optionally the delivery can be filtered by its partner bpnl.")
    public List<DeliveryDto> getAllDeliveries(String materialNumber, Optional<String> bpnl) {
        return ownDeliveryService.findAllByFilters(Optional.of(materialNumber), bpnl)
            .stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @PostMapping()
    @ResponseBody
    @Operation(summary = "Creates a new delivery")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Delivery was created."),
            @ApiResponse(responseCode = "400", description = "Malformed or invalid request body."),
            @ApiResponse(responseCode = "409", description = "Delivery already exists."),
            @ApiResponse(responseCode = "500", description = "Internal Server Error.")
    })
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryDto createDelivery(@RequestBody DeliveryDto deliveryDto) {
        if (!validator.validate(deliveryDto).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }

        if (deliveryDto.getOwnMaterialNumber() == null || deliveryDto.getOwnMaterialNumber().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Delivery Information misses material identification.");
        }

        if (deliveryDto.getPartnerBpnl() == null || deliveryDto.getPartnerBpnl().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Delivery Information misses partner identification.");
        }

        try {
            return convertToDto(ownDeliveryService.create(convertToEntity(deliveryDto)));
        } catch (KeyAlreadyExistsException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Delivery already exists. Use PUT instead.");
        } catch (IllegalArgumentException e) {
            log.info("Delivery is invalid.");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery is invalid.");
        }
    }

    @PutMapping()
    @Operation(summary = "Updates a delivery by its UUID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Delivery was updated."),
            @ApiResponse(responseCode = "400", description = "Malformed or invalid request body."),
            @ApiResponse(responseCode = "404", description = "Delivery does not exist."),
            @ApiResponse(responseCode = "500", description = "Internal Server Error.")
    })
    @ResponseStatus(HttpStatus.OK)
    public DeliveryDto updateDelivery(@RequestBody DeliveryDto dto) {
        OwnDelivery updatedDelivery = ownDeliveryService.update(convertToEntity(dto));
        if (updatedDelivery == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery does not exist.");
        }
        return convertToDto(updatedDelivery);
    }

    @DeleteMapping("{id}")
    @Operation(summary = "Deletes a delivery by its UUID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Delivery was deleted."),
            @ApiResponse(responseCode = "400", description = "Malformed or invalid request body."),
            @ApiResponse(responseCode = "404", description = "Delivery does not exist."),
            @ApiResponse(responseCode = "500", description = "Internal Server Error.")
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDelivery(@PathVariable UUID id) {
        OwnDelivery delivery = ownDeliveryService.findById(id);
        if (delivery == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery does not exist.");
        }
        ownDeliveryService.delete(id);
    }

    @GetMapping("partner")
    @ResponseBody
    @Operation(summary = "Get all deliveries of partners for a material",
        description = "Get all deliveries of partners for a material number. Optionally the partners can be filtered by their bpnl.")
    public List<DeliveryDto> getAllDeliveriesForPartner(String materialNumber, Optional<String> bpnl) {
        return reportedDeliveryService.findAllByFilters(Optional.of(materialNumber), bpnl)
                .stream().map(this::convertToDto).collect(Collectors.toList());
    }

    private OwnDelivery convertToEntity(DeliveryDto dto) {
        OwnDelivery entity = modelMapper.map(dto, OwnDelivery.class);

        Material material = materialService.findByOwnMaterialNumber(dto.getOwnMaterialNumber());
        entity.setMaterial(material);

        Partner existingPartner = partnerService.findByBpnl(dto.getPartnerBpnl());

        if (existingPartner == null) {
            throw new IllegalStateException(String.format(
                    "Partner for bpnl %s could not be found",
                    dto.getPartnerBpnl()));
        }
        entity.setPartner(existingPartner);
        return entity;
    }

    private DeliveryDto convertToDto(Delivery entity) {
        DeliveryDto dto = modelMapper.map(entity, DeliveryDto.class);

        dto.setOwnMaterialNumber(entity.getMaterial().getOwnMaterialNumber());

        dto.setPartnerBpnl(entity.getPartner().getBpnl());
        
        return dto;
    }
}
