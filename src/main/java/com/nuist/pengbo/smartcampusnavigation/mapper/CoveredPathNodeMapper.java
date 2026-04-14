package com.nuist.pengbo.smartcampusnavigation.mapper;

import com.nuist.pengbo.smartcampusnavigation.entity.CoveredPathNode;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CoveredPathNodeMapper {
    List<CoveredPathNode> selectEnabledNodes();
}
