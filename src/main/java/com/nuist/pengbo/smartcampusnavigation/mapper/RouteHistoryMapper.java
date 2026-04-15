package com.nuist.pengbo.smartcampusnavigation.mapper;

import com.nuist.pengbo.smartcampusnavigation.entity.RouteHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface RouteHistoryMapper {
    List<RouteHistory> selectRecentByKeyword(@Param("keyword") String keyword, @Param("limit") int limit);

    RouteHistory selectByRouteSignature(@Param("startLng") BigDecimal startLng,
                                        @Param("startLat") BigDecimal startLat,
                                        @Param("endLng") BigDecimal endLng,
                                        @Param("endLat") BigDecimal endLat,
                                        @Param("viaJson") String viaJson);

    RouteHistory selectById(@Param("id") Long id);

    int countAll();

    int insert(RouteHistory routeHistory);

    int refreshRouteById(@Param("id") Long id);

    int updateTitleById(@Param("id") Long id, @Param("title") String title);

    int deleteById(@Param("id") Long id);

    int deleteOverflow(@Param("limit") int limit);

    int deleteAll();
}
