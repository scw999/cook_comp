package com.gourmetwars.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Boss {
    private String id;
    private String name;
    private String title;
    private String icon;
    private String description;
    private String skillName;
    private String skillDesc;
    private String skillEffect;
    private int fameRequired;
}
