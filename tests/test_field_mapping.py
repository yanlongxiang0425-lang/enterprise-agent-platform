from unittest import TestCase

import pandas as pd

from material_agent.services.field_mapping import build_mapping_from_old_new, map_standard_attr_to_plm


class FieldMappingTests(TestCase):
    def test_map_standard_attr_to_plm_uses_dictionary(self):
        mapping = map_standard_attr_to_plm("物料编码")

        self.assertEqual(mapping.source_field, "编号")
        self.assertEqual(mapping.strategy, "dictionary")
        self.assertEqual(mapping.confidence, 1.0)

    def test_build_mapping_from_old_new_marks_manual_required(self):
        old_standard = pd.DataFrame({"属性名称": ["新料号", "短描述"]})
        new_standard = pd.DataFrame(
            {
                "属性分类": ["基本信息", "扩展信息"],
                "新属性名称": ["物料编码", "无法自动识别字段"],
                "业务定义": ["物料编码", "测试"],
            }
        )

        result = build_mapping_from_old_new(old_standard, new_standard)

        code_row = result[result["新属性名称"] == "物料编码"].iloc[0]
        manual_row = result[result["新属性名称"] == "无法自动识别字段"].iloc[0]
        self.assertEqual(code_row["旧属性名称"], "新料号")
        self.assertEqual(code_row["映射策略"], "alias-dictionary")
        self.assertEqual(manual_row["映射策略"], "manual-required")
