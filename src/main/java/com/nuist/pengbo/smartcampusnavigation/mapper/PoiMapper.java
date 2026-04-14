package com.nuist.pengbo.smartcampusnavigation.mapper;

import com.nuist.pengbo.smartcampusnavigation.dto.poi.PoiQueryRequest;
import com.nuist.pengbo.smartcampusnavigation.entity.Poi;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PoiMapper {
    List<Poi> selectByCondition(@Param("query") PoiQueryRequest query);

    Poi selectById(@Param("id") Long id);

    int insert(Poi poi);

    int updateById(Poi poi);

    int deleteById(@Param("id") Long id);
}
