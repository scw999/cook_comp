package com.gourmetwars.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Theme {
    private String id;
    private String name;
    private String icon;
    private List<String> matchIngredients;
}
