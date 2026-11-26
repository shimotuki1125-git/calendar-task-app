import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type {
  Recurrence,
  RecurrenceFreq,
} from '@/types/task';

type RecurrencePickerProps = {
  value: Recurrence | undefined;

  onChange: (
    recurrence: Recurrence | undefined
  ) => void;
};

const OPTIONS: {
  freq: RecurrenceFreq | null;
  label: string;
}[] = [
  { freq: null, label: 'なし' },
  { freq: 'daily', label: '毎日' },
  { freq: 'weekly', label: '毎週' },
  { freq: 'monthly', label: '毎月' },
];

export default function RecurrencePicker({
  value,
  onChange,
}: RecurrencePickerProps) {
  const theme = useTheme();

  const selectedFreq = value?.freq ?? null;

  const handleSelect = (
    freq: RecurrenceFreq | null
  ) => {
    if (freq === null) {
      onChange(undefined);
      return;
    }

    // 頻度を変えても終了日は引き継ぐ
    onChange({
      freq,
      until: value?.until,
    });
  };

  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const selected =
          selectedFreq === option.freq;

        return (
          <Pressable
            key={option.label}
            style={[
              styles.chip,
              {
                borderColor: theme.border,
                backgroundColor:
                  theme.inputBackground,
              },
              selected && {
                backgroundColor: theme.accent,
                borderColor: theme.accent,
              },
            ]}
            onPress={() =>
              handleSelect(option.freq)
            }
          >
            <Text
              style={[
                styles.chipText,
                { color: theme.textSecondary },
                selected && [
                  styles.chipTextSelected,
                  { color: theme.accentText },
                ],
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  chipText: {
    fontSize: 14,
  },

  chipTextSelected: {
    fontWeight: '600',
  },
});
