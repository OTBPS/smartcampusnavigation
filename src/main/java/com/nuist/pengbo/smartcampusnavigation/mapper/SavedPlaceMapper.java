package com.nuist.pengbo.smartcampusnavigation.mapper;

import com.nuist.pengbo.smartcampusnavigation.entity.SavedPlace;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface SavedPlaceMapper {
    List<SavedPlace> selectAll();

    int countAll();

    SavedPlace selectById(@Param("id") Long id);

    SavedPlace selectByPoiId(@Param("poiId") Long poiId);

    SavedPlace selectByRoundedCoordinate(@Param("longitude") BigDecimal longitude,
                                         @Param("latitude") BigDecimal latitude);

    int insert(SavedPlace savedPlace);

    int updateById(SavedPlace savedPlace);

    int updateNameById(@Param("id") Long id, @Param("name") String name);

    int deleteById(@Param("id") Long id);
}
