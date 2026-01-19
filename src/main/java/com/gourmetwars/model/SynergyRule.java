package com.gourmetwars.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SynergyRule {
    private List<String> ingredients;
    private int bonus;
    private String message;
}
